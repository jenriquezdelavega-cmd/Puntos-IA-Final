import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import { isMissingTableOrColumnError } from '@/app/lib/prisma-error-helpers';
import { getRedemptionRewardLabel } from '@/app/lib/redemption-display';

const BUSINESS_TZ = 'America/Monterrey';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const normalizedUserId = asTrimmedString(body.userId);
    if (!normalizedUserId) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Falta ID',
      });
    }

    const session = verifyUserSessionToken(asTrimmedString(body.sessionToken));
    if (session.uid !== normalizedUserId) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const redemptions = await prisma.redemption.findMany({
      where: {
        userId: normalizedUserId,
        isUsed: true,
      },
      include: {
        tenant: {
          select: { name: true, prize: true },
        },
        loyaltyMilestone: {
          select: { reward: true, emoji: true },
        },
        coalitionRewardUnlock: {
          include: {
            reward: {
              select: { title: true, rewardValue: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const history = redemptions.map((redemption) => ({
      id: redemption.id,
      tenant: redemption.tenant.name,
      prize: getRedemptionRewardLabel({
        tenantPrize: redemption.tenant.prize,
        code: redemption.code,
        loyaltyMilestone: redemption.loyaltyMilestone,
        coalitionRewardUnlock: redemption.coalitionRewardUnlock,
      }),
      date: new Date(redemption.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: BUSINESS_TZ,
      }),
      time: new Date(redemption.createdAt).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: BUSINESS_TZ,
      }),
    }));

    return apiSuccess({ requestId, data: { history } });
  } catch (error: unknown) {
    if (isMissingTableOrColumnError(error)) {
      return apiSuccess({
        requestId,
        data: {
          history: [],
          warning: 'Historial no disponible temporalmente',
        },
      });
    }

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
