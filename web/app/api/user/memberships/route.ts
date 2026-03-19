import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import { isMissingTableOrColumnError } from '@/app/lib/prisma-error-helpers';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';

type MilestoneSnapshot = {
  id: string;
  visitTarget: number;
  reward: string;
  emoji: string;
  redeemed: boolean;
};

type MembershipSnapshot = {
  tenantId: string;
  name?: string;
  prize?: string;
  instagram?: string;
  requiredVisits?: number;
  rewardPeriod?: string;
  logoData?: string;
  visits?: number;
  points?: number;
  rewardCodeStatus: 'READY_TO_GENERATE' | 'CODE_PENDING' | 'CODE_USED';
  rewardCodeLabel?: string;
  pendingRewardCode?: string | null;
  milestones?: MilestoneSnapshot[];
};

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const userId = asTrimmedString(body.userId);
    const sessionToken = asTrimmedString(body.sessionToken);

    if (!userId || !sessionToken) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Faltan datos' });
    }

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('user-memberships', request, userId),
      limit: 40,
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

    const session = verifyUserSessionToken(sessionToken);
    if (session.uid !== userId) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        tenant: {
          isActive: true,
        },
      },
      select: {
        tenantId: true,
        currentVisits: true,
        tenant: {
          select: {
            isActive: true,
            name: true,
            prize: true,
            instagram: true,
            requiredVisits: true,
            loyaltyMilestones: {
              orderBy: { visitTarget: 'asc' },
              select: { id: true, visitTarget: true, reward: true, emoji: true },
            },
          },
        },
      },
      orderBy: { tenantId: 'asc' },
    });

    const tenantIds = memberships.map((membership) => membership.tenantId);
    const milestoneIdSet = new Set(
      memberships.flatMap((membership) => membership.tenant.loyaltyMilestones.map((milestone) => milestone.id)),
    );
    const allMilestoneIds = [...milestoneIdSet];

    const [mainRedemptions, usedMilestoneRedemptions] = tenantIds.length
      ? await Promise.all([
          prisma.redemption.findMany({
            where: {
              userId,
              tenantId: { in: tenantIds },
              loyaltyMilestoneId: null,
              coalitionRewardUnlockId: null,
            },
            select: {
              tenantId: true,
              code: true,
              isUsed: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          allMilestoneIds.length
            ? prisma.redemption.findMany({
                where: {
                  userId,
                  tenantId: { in: tenantIds },
                  isUsed: true,
                  loyaltyMilestoneId: { in: allMilestoneIds },
                },
                select: { loyaltyMilestoneId: true },
              })
            : Promise.resolve([]),
        ])
      : [[], []];

    const mainRedemptionsByTenant = new Map<string, Array<(typeof mainRedemptions)[number]>>();
    mainRedemptions.forEach((redemption) => {
      const list = mainRedemptionsByTenant.get(redemption.tenantId) || [];
      list.push(redemption);
      mainRedemptionsByTenant.set(redemption.tenantId, list);
    });

    const redeemedMilestoneIds = new Set<string>(
      usedMilestoneRedemptions
        .map((redemption) => redemption.loyaltyMilestoneId)
        .filter((value): value is string => Boolean(value)),
    );

    const data: MembershipSnapshot[] = memberships
      .map((membership) => {
        const visits = Number(membership.currentVisits ?? 0);
        const points = visits * 10;
        const tenantMainRedemptions = mainRedemptionsByTenant.get(membership.tenantId) || [];
        const pendingRedemption = tenantMainRedemptions.find((item) => !item.isUsed) || null;
        const latestMainRedemption = tenantMainRedemptions[0] || null;

        let rewardCodeStatus: MembershipSnapshot['rewardCodeStatus'] = 'READY_TO_GENERATE';
        let rewardCodeLabel = 'Listo para generar código';

        if (pendingRedemption) {
          rewardCodeStatus = 'CODE_PENDING';
          rewardCodeLabel = 'Tienes un código pendiente por usar';
        } else if (latestMainRedemption?.isUsed) {
          rewardCodeStatus = 'CODE_USED';
          rewardCodeLabel = 'Tu último código ya fue canjeado';
        }

        return {
          tenantId: membership.tenantId,
          name: membership.tenant.name,
          prize: membership.tenant.prize ?? 'Premio Sorpresa',
          instagram: membership.tenant.instagram ?? '',
          requiredVisits: membership.tenant.requiredVisits ?? 10,
          rewardPeriod: 'OPEN',
          logoData: '',
          visits,
          points,
          rewardCodeStatus,
          rewardCodeLabel,
          pendingRewardCode: pendingRedemption?.code ?? null,
          milestones: membership.tenant.loyaltyMilestones.map((milestone) => ({
            id: milestone.id,
            visitTarget: milestone.visitTarget,
            reward: milestone.reward,
            emoji: milestone.emoji,
            redeemed: redeemedMilestoneIds.has(milestone.id),
          })),
        };
      });

    return apiSuccess({ requestId, data: { memberships: data } });
  } catch (error: unknown) {
    if (isMissingTableOrColumnError(error)) {
      return apiSuccess({
        requestId,
        data: {
          memberships: [],
          warning: 'Membresías no disponibles temporalmente',
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
