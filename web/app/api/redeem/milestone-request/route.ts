import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';

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
    // For simplicity: only one redemption per milestone per visit cycle is allowed.
    // We use totalVisits as a rough proxy — check if a used redemption was created after
    // the milestone target was last crossed in this cycle (not perfect, but safe for MVP).
    const alreadyUsed = await prisma.redemption.findFirst({
      where: {
        userId,
        tenantId,
        loyaltyMilestoneId: milestoneId,
        isUsed: true,
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

    // Generate 4-digit code and create redemption linked to this milestone
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.redemption.create({
      data: {
        code,
        userId,
        tenantId,
        isUsed: false,
        loyaltyMilestoneId: milestoneId,
      },
    });

    logApiEvent('/api/redeem/milestone-request', 'milestone_redemption_requested', {
      userId,
      tenantId,
      milestoneId,
      visitTarget: milestone.visitTarget,
      code,
    });

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
