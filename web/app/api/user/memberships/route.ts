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
              usedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.redemption.findMany({
            where: {
              userId,
              tenantId: { in: tenantIds },
              isUsed: true,
              loyaltyMilestoneId: { not: null },
            },
            select: {
              tenantId: true,
              loyaltyMilestoneId: true,
              rewardSnapshot: true,
              usedAt: true,
              createdAt: true,
              loyaltyMilestone: {
                select: {
                  visitTarget: true,
                  reward: true,
                  emoji: true,
                },
              },
            },
          }),
        ])
      : [[], []];

    const mainRedemptionsByTenant = new Map<string, Array<(typeof mainRedemptions)[number]>>();
    mainRedemptions.forEach((redemption) => {
      const list = mainRedemptionsByTenant.get(redemption.tenantId) || [];
      list.push(redemption);
      mainRedemptionsByTenant.set(redemption.tenantId, list);
    });

    const normalizeLabel = (label: string) => label.trim().toLowerCase();

    const redeemedMilestoneIdsByTenant = new Map<string, Set<string>>();
    const redeemedMilestoneTargetsByTenant = new Map<string, Set<number>>();
    const redeemedMilestoneLabelsByTenant = new Map<string, Set<string>>();

    usedMilestoneRedemptions.forEach((redemption) => {
      const tenantId = redemption.tenantId;
      const tenantMainRedemptions = mainRedemptionsByTenant.get(tenantId) || [];
      const latestUsedMain = tenantMainRedemptions.find((item) => item.isUsed) || null;
      const latestUsedMainAt = latestUsedMain ? (latestUsedMain.usedAt ?? latestUsedMain.createdAt) : null;
      const milestoneUsedAt = redemption.usedAt ?? redemption.createdAt;

      if (latestUsedMainAt && milestoneUsedAt <= latestUsedMainAt) {
        return;
      }

      if (redemption.loyaltyMilestoneId) {
        const ids = redeemedMilestoneIdsByTenant.get(tenantId) || new Set<string>();
        ids.add(redemption.loyaltyMilestoneId);
        redeemedMilestoneIdsByTenant.set(tenantId, ids);
      }

      const visitTarget = redemption.loyaltyMilestone?.visitTarget;
      if (typeof visitTarget === 'number' && Number.isFinite(visitTarget)) {
        const targets = redeemedMilestoneTargetsByTenant.get(tenantId) || new Set<number>();
        targets.add(visitTarget);
        redeemedMilestoneTargetsByTenant.set(tenantId, targets);
      }

      const snapshot = String(redemption.rewardSnapshot ?? '').trim();
      if (snapshot) {
        const labels = redeemedMilestoneLabelsByTenant.get(tenantId) || new Set<string>();
        labels.add(normalizeLabel(snapshot));
        redeemedMilestoneLabelsByTenant.set(tenantId, labels);
      }
    });

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

        const redeemedIds = redeemedMilestoneIdsByTenant.get(membership.tenantId) || new Set<string>();
        const redeemedTargets = redeemedMilestoneTargetsByTenant.get(membership.tenantId) || new Set<number>();
        const redeemedLabels = redeemedMilestoneLabelsByTenant.get(membership.tenantId) || new Set<string>();

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
            redeemed:
              redeemedIds.has(milestone.id) ||
              redeemedTargets.has(milestone.visitTarget) ||
              redeemedLabels.has(normalizeLabel(`${milestone.emoji ? `${milestone.emoji} ` : ''}${milestone.reward}`)),
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
