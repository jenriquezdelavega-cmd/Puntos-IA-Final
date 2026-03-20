import { ChallengeType } from '@prisma/client';

import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';

type MasterAction = 'LIST' | 'CREATE' | 'UPDATE' | 'DELETE';

function asPositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function asOptionalNullableString(value: unknown) {
  const parsed = asTrimmedString(value);
  return parsed.length > 0 ? parsed : null;
}

function parseChallengeType(value: unknown): ChallengeType | null {
  const parsed = asTrimmedString(value);
  if (parsed === ChallengeType.VISIT_COUNT || parsed === ChallengeType.DISTINCT_BUSINESSES) {
    return parsed;
  }
  return null;
}

function parseAction(value: unknown): MasterAction | null {
  const parsed = asTrimmedString(value).toUpperCase();
  if (parsed === 'LIST' || parsed === 'CREATE' || parsed === 'UPDATE' || parsed === 'DELETE') {
    return parsed;
  }
  return null;
}

async function getDashboardData() {
  const [challenges, rewards, businesses] = await Promise.all([
    prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        rewardCampaign: {
          include: {
            business: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    prisma.coalitionReward.findMany({
      where: { active: true },
      orderBy: [{ business: { name: 'asc' } }, { title: 'asc' }],
      include: {
        business: { select: { id: true, name: true } },
      },
    }),
    prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { challenges, rewards, businesses };
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const masterUsername = asTrimmedString(body.masterUsername);
    const masterPassword = asTrimmedString(body.masterPassword);
    const masterOtp = asTrimmedString(body.masterOtp);
    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const action = parseAction(body.action ?? 'LIST');
    if (!action) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Acción inválida' });
    }

    if (action === 'LIST') {
      return apiSuccess({ requestId, data: await getDashboardData() });
    }

    if (action === 'DELETE') {
      const challengeId = asTrimmedString(body.challengeId);
      if (!challengeId) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Falta challengeId' });
      }

      const existing = await prisma.challenge.findUnique({ where: { id: challengeId }, select: { id: true } });
      if (!existing) {
        return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Reto no encontrado' });
      }

      await prisma.challenge.delete({ where: { id: challengeId } });
      return apiSuccess({ requestId, data: await getDashboardData() });
    }

    const challengeType = parseChallengeType(body.challengeType);
    const title = asTrimmedString(body.title);
    const description = asTrimmedString(body.description);

    if (!challengeType || !title || !description) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Datos de reto incompletos' });
    }

    const rewardCampaignId = asOptionalNullableString(body.rewardCampaignId);
    if (rewardCampaignId) {
      const reward = await prisma.coalitionReward.findUnique({
        where: { id: rewardCampaignId },
        select: { id: true, active: true },
      });

      if (!reward || !reward.active) {
        return apiError({
          requestId,
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Recompensa inválida o inactiva',
        });
      }
    }

    const challengeInput = {
      title,
      description,
      challengeType,
      targetValue: clamp(asPositiveInt(body.targetValue, 1), 1, 500),
      timeWindow: clamp(asPositiveInt(body.timeWindow, 30), 1, 365),
      active: body.active !== false,
      rewardCampaignId,
    };

    if (action === 'CREATE') {
      await prisma.challenge.create({
        data: challengeInput,
      });
      return apiSuccess({ requestId, data: await getDashboardData(), status: 201 });
    }

    const challengeId = asTrimmedString(body.challengeId);
    if (!challengeId) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Falta challengeId' });
    }

    const existingChallenge = await prisma.challenge.findUnique({ where: { id: challengeId }, select: { id: true } });
    if (!existingChallenge) {
      return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Reto no encontrado' });
    }

    await prisma.challenge.update({
      where: { id: challengeId },
      data: challengeInput,
    });

    return apiSuccess({ requestId, data: await getDashboardData() });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error al administrar retos',
    });
  }
}
