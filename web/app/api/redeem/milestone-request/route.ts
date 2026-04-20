import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import { generateUniqueRedemptionCode } from '@/app/lib/redemption-code';
import { sendRedemptionRequestedEmail } from '@/app/lib/email';

function formatRewardValidityLabel(period: string | null | undefined) {
  switch (String(period || 'OPEN')) {
    case 'MONTHLY':
      return 'Válido durante el mes en curso';
    case 'QUARTERLY':
      return 'Válido durante el trimestre en curso';
    case 'SEMESTER':
      return 'Válido durante el semestre en curso';
    case 'ANNUAL':
      return 'Válido durante el año en curso';
    default:
      return 'Sin vigencia por periodo';
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const userId = asTrimmedString(body.userId);
    const tenantId = asTrimmedString(body.tenantId);
    const sessionToken = asTrimmedString(body.sessionToken);
    const milestoneId = asTrimmedString(body.milestoneId);

    if (!userId || !tenantId || !sessionToken || !milestoneId) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Faltan campos requeridos' });
    }

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('milestone-redeem', request, userId),
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'BAD_REQUEST',
        message: `Demasiadas solicitudes. Intenta en ${rateLimit.retryAfterSeconds}s`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    // Verify session
    const session = verifyUserSessionToken(sessionToken);
    if (session.uid !== userId) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'Sesión inválida' });
    }

    // Load milestone
    const milestone = await prisma.loyaltyMilestone.findUnique({
      where: { id: milestoneId },
      select: { id: true, tenantId: true, visitTarget: true, reward: true, emoji: true },
    });

    if (!milestone || milestone.tenantId !== tenantId) {
      return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Hito no encontrado' });
    }

    // Load membership to verify visits
    const membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: { currentVisits: true, totalVisits: true },
    });

    if (!membership) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'No tienes membresía en este negocio' });
    }

    if (membership.currentVisits < milestone.visitTarget) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Necesitas ${milestone.visitTarget - membership.currentVisits} visita(s) más para este beneficio`,
      });
    }

    // Check if already redeemed for this milestone in the current cycle
    // (i.e., an unused or used redemption linked to this milestone still exists)
    const existingRedemption = await prisma.redemption.findFirst({
      where: {
        userId,
        tenantId,
        loyaltyMilestoneId: milestoneId,
        isUsed: false,
      },
    });

    if (existingRedemption) {
      const milestoneSnapshot = `${milestone.emoji ? `${milestone.emoji} ` : ''}${milestone.reward}`.trim() || null;
      if (!String(existingRedemption.rewardSnapshot ?? '').trim() && milestoneSnapshot) {
        await prisma.redemption.update({
          where: { id: existingRedemption.id },
          data: { rewardSnapshot: milestoneSnapshot },
        });
      }
      // Already has a pending code — return it again so they can see it
      return apiSuccess({
        requestId,
        data: {
          code: existingRedemption.code,
          reward: milestone.reward,
          emoji: milestone.emoji,
          alreadyPending: true,
        },
      });
    }

    // Check if already redeemed (used code) since last counter reset
    // One redemption per milestone per cycle. A cycle resets when the main reward
    // (non-milestone, non-coalition) is validated.
    const latestMainRewardRedemption = await prisma.redemption.findFirst({
      where: {
        userId,
        tenantId,
        isUsed: true,
        loyaltyMilestoneId: null,
        coalitionRewardUnlockId: null,
      },
      select: { usedAt: true, createdAt: true },
      orderBy: [{ usedAt: 'desc' }, { createdAt: 'desc' }],
    });
    const cycleStartAt = latestMainRewardRedemption
      ? (latestMainRewardRedemption.usedAt ?? latestMainRewardRedemption.createdAt)
      : null;

    const alreadyUsed = await prisma.redemption.findFirst({
      where: {
        userId,
        tenantId,
        loyaltyMilestoneId: milestoneId,
        isUsed: true,
        ...(cycleStartAt
          ? {
              OR: [
                { usedAt: { gt: cycleStartAt } },
                { usedAt: null, createdAt: { gt: cycleStartAt } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (alreadyUsed) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Este beneficio (${milestone.emoji} ${milestone.reward}) ya fue canjeado en este ciclo`,
      });
    }

    // Generate robust 8-char code and create redemption linked to this milestone
    const code = await generateUniqueRedemptionCode(tenantId);

    await prisma.redemption.create({
      data: {
        code,
        userId,
        tenantId,
        isUsed: false,
        loyaltyMilestoneId: milestoneId,
        rewardSnapshot: `${milestone.emoji ? `${milestone.emoji} ` : ''}${milestone.reward}`.trim() || null,
      },
    });

    logApiEvent('/api/redeem/milestone-request', 'milestone_redemption_requested', {
      userId,
      tenantId,
      milestoneId,
      visitTarget: milestone.visitTarget,
      code,
    });

    try {
      const [tenant, customer] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, rewardPeriod: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      ]);
      if (tenant?.name && customer?.email) {
        const milestoneReward = `${milestone.emoji ? `${milestone.emoji} ` : ''}${milestone.reward}`.trim();
        const emailResult = await sendRedemptionRequestedEmail({
          to: customer.email,
          name: customer.name,
          businessName: tenant.name,
          code,
          rewardName: milestoneReward || milestone.reward,
          validityLabel: formatRewardValidityLabel(tenant.rewardPeriod),
        });
        if (!emailResult.ok) {
          logApiEvent('/api/redeem/milestone-request', 'milestone_redemption_email_failed', {
            userId,
            tenantId,
            reason: emailResult.error || 'unknown',
          });
        }
      }
    } catch (emailError: unknown) {
      logApiError('/api/redeem/milestone-request#email', emailError);
    }

    return apiSuccess({
      requestId,
      data: {
        code,
        reward: milestone.reward,
        emoji: milestone.emoji,
        alreadyPending: false,
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = String((error as { message?: string }).message || '');
      if (msg.startsWith('sessionToken')) {
        return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'Sesión inválida' });
      }
    }
    logApiError('/api/redeem/milestone-request', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error inesperado',
    });
  }
}
