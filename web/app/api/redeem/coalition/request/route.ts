import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { generateUniqueRedemptionCode } from '@/app/lib/redemption-code';
import { sendRedemptionRequestedEmail } from '@/app/lib/email';

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

    const code = await generateUniqueRedemptionCode(customerReward.reward.business.id);

    await prisma.$transaction([
      prisma.redemption.create({
        data: {
          code,
          userId,
          tenantId: customerReward.reward.business.id,
          isUsed: false,
          coalitionRewardUnlockId: customerReward.id,
          rewardSnapshot: customerReward.reward.rewardValue
            ? `${customerReward.reward.title} · ${customerReward.reward.rewardValue}`
            : customerReward.reward.title,
        },
      }),
      prisma.customerCoalitionReward.update({
        where: { id: customerReward.id },
        data: { requestedAt: new Date() },
      }),
    ]);

    try {
      const customer = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (customer?.email) {
        const emailResult = await sendRedemptionRequestedEmail({
          to: customer.email,
          name: customer.name,
          businessName: customerReward.reward.business.name,
          code,
        });
        if (!emailResult.ok) {
          logApiEvent('/api/redeem/coalition/request', 'coalition_redemption_email_failed', {
            userId,
            customerRewardId,
            reason: emailResult.error || 'unknown',
          });
        }
      }
    } catch (emailError: unknown) {
      logApiError('/api/redeem/coalition/request#email', emailError);
    }

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
