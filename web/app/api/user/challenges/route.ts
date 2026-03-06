import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const userId = asTrimmedString(body.userId);
    if (!userId) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Falta ID' });
    }

    const session = verifyUserSessionToken(asTrimmedString(body.sessionToken));
    if (session.uid !== userId) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const challenges = await prisma.challenge.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: {
        customerProgress: {
          where: { customerId: userId },
          select: {
            progressValue: true,
            status: true,
            completedAt: true,
          },
        },
        rewardCampaign: {
          include: {
            business: { select: { name: true } },
          },
        },
      },
    });

    const items = challenges.map((challenge) => {
      const progress = challenge.customerProgress[0];
      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        challengeType: challenge.challengeType,
        targetValue: challenge.targetValue,
        timeWindow: challenge.timeWindow,
        progressValue: progress?.progressValue ?? 0,
        status: progress?.status ?? 'IN_PROGRESS',
        completedAt: progress?.completedAt ?? null,
        reward: challenge.rewardCampaign
          ? {
              id: challenge.rewardCampaign.id,
              title: challenge.rewardCampaign.title,
              rewardType: challenge.rewardCampaign.rewardType,
              rewardValue: challenge.rewardCampaign.rewardValue,
              businessName: challenge.rewardCampaign.business.name,
            }
          : null,
      };
    });

    return apiSuccess({ requestId, data: { challenges: items } });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message?: string }).message || '');
      if (message.startsWith('sessionToken')) {
        return apiError({
          requestId,
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Sesión inválida, vuelve a iniciar sesión',
        });
      }
    }

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error',
    });
  }
}
