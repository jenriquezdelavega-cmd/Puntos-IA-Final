import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { RewardPeriod } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { periodKey } from '@/app/lib/reward-period';
import { resetMembershipForPeriodRollover } from '@/app/lib/period-rollover';
const TZ = 'America/Monterrey';

function dayKeyInBusinessTz(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const parsedBody = parseWithSchema(body, {
      userId: requiredString,
      tenantId: requiredString,
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

    const { userId, tenantId, sessionToken } = parsedBody.data;
    const normalizedUserId = asTrimmedString(userId);
    const normalizedTenantId = asTrimmedString(tenantId);

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('redeem-request', request, normalizedUserId),
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

    if (!normalizedUserId || !normalizedTenantId) {
      logApiEvent('/api/redeem/request', 'validation_error', {
        hasUserId: Boolean(normalizedUserId),
        hasTenantId: Boolean(normalizedTenantId),
      });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Faltan datos',
      });
    }

    const session = verifyUserSessionToken(asTrimmedString(sessionToken));
    if (session.uid !== normalizedUserId) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: normalizedTenantId },
      select: {
        id: true,
        name: true,
        prize: true,
        requiredVisits: true,
        rewardPeriod: true,
      },
    });
    if (!tenant) {
      logApiEvent('/api/redeem/request', 'tenant_not_found', { tenantId: normalizedTenantId });
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Negocio no encontrado',
      });
    }

    let membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId: normalizedTenantId, userId: normalizedUserId } },
    });

    if (!membership) {
      logApiEvent('/api/redeem/request', 'membership_not_found', {
        userId: normalizedUserId,
        tenantId: normalizedTenantId,
      });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'No tienes membresía',
      });
    }

    const now = new Date();
    const tenantPeriod = (tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    const curType = (membership.periodType as RewardPeriod) || 'OPEN';
    const curKey = periodKey(curType, now);

    if ((membership.periodKey || 'OPEN') !== curKey) {
      const rollover = await resetMembershipForPeriodRollover({
        membershipId: membership.id,
        tenantId: normalizedTenantId,
        userId: normalizedUserId,
        nextPeriodKey: curKey,
      });
      membership = rollover.membership;
      logApiEvent('/api/redeem/request', 'period_rollover_reset', {
        userId: normalizedUserId,
        tenantId: normalizedTenantId,
        nextPeriodKey: curKey,
        deletedPendingRewards: rollover.deletedPendingRewards,
      });
    }

    const existingPending = await prisma.redemption.findFirst({
      where: {
        userId: normalizedUserId,
        tenantId: normalizedTenantId,
        isUsed: false,
        loyaltyMilestoneId: null,
        coalitionRewardUnlockId: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPending) {
      if (!String(existingPending.rewardSnapshot ?? '').trim()) {
        await prisma.redemption.update({
          where: { id: existingPending.id },
          data: { rewardSnapshot: String(tenant.prize ?? '').trim() || null },
        });
      }
      return apiSuccess({
        requestId,
        data: {
          success: true,
          code: existingPending.code,
          alreadyPending: true,
        },
      });
    }

    const requiredVisits = tenant.requiredVisits ?? 10;
    const currentVisits = membership.currentVisits ?? 0;

    if (currentVisits < requiredVisits) {
      logApiEvent('/api/redeem/request', 'insufficient_visits', {
        userId: normalizedUserId,
        tenantId: normalizedTenantId,
        currentVisits,
        requiredVisits,
      });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Te faltan ${requiredVisits - currentVisits} visita(s) para canjear`,
      });
    }

    const todayBusinessDay = dayKeyInBusinessTz(now);
    const alreadyRedeemedToday = await prisma.$queryRaw<{ id: string }[]>`
      SELECT r.id
      FROM "Redemption" r
      WHERE r."userId" = ${normalizedUserId}
        AND r."tenantId" = ${normalizedTenantId}
        AND r."isUsed" = TRUE
        AND r."loyalty_milestone_id" IS NULL
        AND r."coalition_reward_unlock_id" IS NULL
        AND to_char((COALESCE(r."usedAt", r."createdAt") AT TIME ZONE ${TZ}), 'YYYY-MM-DD') = ${todayBusinessDay}
      ORDER BY COALESCE(r."usedAt", r."createdAt") DESC
      LIMIT 1
    `;

    if (alreadyRedeemedToday.length > 0) {
      logApiEvent('/api/redeem/request', 'already_redeemed_today', {
        userId: normalizedUserId,
        tenantId: normalizedTenantId,
        redemptionId: alreadyRedeemedToday[0]?.id || null,
      });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Este premio ya fue canjeado hoy. Intenta de nuevo mañana.',
      });
    }

    logApiEvent('/api/redeem/request', 'no_pending_code_available', {
      userId: normalizedUserId,
      tenantId: normalizedTenantId,
      currentVisits,
      requiredVisits,
    });

    return apiSuccess({
      requestId,
      data: {
        success: false,
        alreadyPending: false,
        message: 'Tu código se genera automáticamente al registrar la visita donde completas la meta.',
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

    logApiError('/api/redeem/request', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: `Error técnico: ${error instanceof Error ? error.message : ''}`,
    });
  }
}
