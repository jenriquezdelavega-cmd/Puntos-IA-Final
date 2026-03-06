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

    const unlocked = await prisma.customerCoalitionReward.findMany({
      where: {
        customerId: userId,
        reward: {
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      },
      orderBy: { unlockedAt: 'desc' },
      include: {
        reward: {
          include: {
            business: { select: { id: true, name: true } },
          },
        },
        redemption: {
          select: { code: true, isUsed: true, createdAt: true },
        },
      },
    });

    const rewards = unlocked.map((item) => ({
      id: item.id,
      unlockedAt: item.unlockedAt,
      requestedAt: item.requestedAt,
      redeemedAt: item.redeemedAt,
      status: item.redeemedAt ? 'REDEEMED' : item.requestedAt ? 'REQUESTED' : 'UNLOCKED',
      redemption: item.redemption
        ? {
            code: item.redemption.code,
            isUsed: item.redemption.isUsed,
            createdAt: item.redemption.createdAt,
          }
        : null,
      reward: {
        id: item.reward.id,
        title: item.reward.title,
        rewardType: item.reward.rewardType,
        rewardValue: item.reward.rewardValue,
        redemptionLimit: item.reward.redemptionLimit,
        expiresAt: item.reward.expiresAt,
        business: item.reward.business,
      },
    }));

    return apiSuccess({ requestId, data: { rewards } });
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
