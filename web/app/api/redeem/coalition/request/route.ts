import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      userId: requiredString,
      customerRewardId: requiredString,
      sessionToken: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const userId = asTrimmedString(parsedBody.data.userId);
    const customerRewardId = asTrimmedString(parsedBody.data.customerRewardId);

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('redeem-coalition-request', request, userId),
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'BAD_REQUEST',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const session = verifyUserSessionToken(asTrimmedString(parsedBody.data.sessionToken));
    if (session.uid !== userId) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const customerReward = await prisma.customerCoalitionReward.findFirst({
      where: {
        id: customerRewardId,
        customerId: userId,
        redeemedAt: null,
        reward: {
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      },
      include: {
        reward: {
          include: {
            business: { select: { id: true, name: true } },
          },
        },
        redemption: true,
      },
    });

    if (!customerReward) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Beneficio no disponible o ya fue solicitado',
      });
    }

    if (customerReward.redemption && !customerReward.redemption.isUsed) {
      return apiSuccess({
        requestId,
        data: {
          success: true,
          code: customerReward.redemption.code,
          tenantName: customerReward.reward.business.name,
          rewardTitle: customerReward.reward.title,
          rewardValue: customerReward.reward.rewardValue,
          alreadyRequested: true,
          status: 'REQUESTED',
        },
      });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.$transaction([
      prisma.redemption.create({
        data: {
          code,
          userId,
          tenantId: customerReward.reward.business.id,
          isUsed: false,
          coalitionRewardUnlockId: customerReward.id,
        },
      }),
      prisma.customerCoalitionReward.update({
        where: { id: customerReward.id },
        data: { requestedAt: new Date() },
      }),
    ]);

    return apiSuccess({
      requestId,
      data: {
        success: true,
        code,
        tenantName: customerReward.reward.business.name,
        rewardTitle: customerReward.reward.title,
        rewardValue: customerReward.reward.rewardValue,
        status: 'REQUESTED',
      },
    });
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
      message: error instanceof Error ? error.message : 'Error técnico',
    });
  }
}
