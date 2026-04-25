import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';
import { generateCustomerPass } from '@/app/lib/customer-pass';

type Params = {
  params: Promise<{ customer_id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  const requestId = getRequestId(req);

  try {
    const { customer_id } = await params;
    const customerId = asTrimmedString(customer_id);

    if (!customerId) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'customer_id requerido',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true },
    });

    if (!user) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Cliente no encontrado',
      });
    }

    const url = new URL(req.url);
    const businessId = asTrimmedString(url.searchParams.get('businessId') || url.searchParams.get('business_id'));
    const normalizeRewardLabel = (value: string | null | undefined) => String(value || '').trim().toLowerCase();

    type MilestoneData = {
      id: string;
      visitTarget: number;
      reward: string;
      emoji: string;
      redeemed: boolean;
      pendingCode?: string | null;
    };
    let business: {
      id: string;
      name: string;
      currentVisits: number;
      requiredVisits: number;
      milestones: MilestoneData[];
    } | null = null;

    if (businessId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
          requiredVisits: true,
          loyaltyMilestones: {
            orderBy: { visitTarget: 'asc' },
            select: { id: true, visitTarget: true, reward: true, emoji: true },
          },
        },
      });

      if (tenant) {
        const membership = await prisma.membership.findUnique({
          where: {
            tenantId_userId: {
              tenantId: tenant.id,
              userId: user.id,
            },
          },
          select: { currentVisits: true },
        });

        // Find milestone redemptions (used + pending) to present the current state in the pass.
        const milestoneRedemptions = await prisma.redemption.findMany({
          where: {
            userId: user.id,
            tenantId: tenant.id,
            loyaltyMilestoneId: { not: null },
          },
          select: {
            loyaltyMilestoneId: true,
            isUsed: true,
            code: true,
            createdAt: true,
            rewardSnapshot: true,
            loyaltyMilestone: {
              select: {
                visitTarget: true,
                reward: true,
                emoji: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        const redeemedSet = new Set<string>();
        const pendingCodeByMilestone = new Map<string, string>();
        const pendingCodeByVisitTarget = new Map<number, string>();
        const pendingCodeByRewardLabel = new Map<string, string>();

        milestoneRedemptions.forEach((redemption) => {
          const milestoneId = String(redemption.loyaltyMilestoneId || '').trim();
          if (!milestoneId) return;
          if (redemption.isUsed) {
            redeemedSet.add(milestoneId);
            return;
          }
          const milestoneTarget = Number(redemption.loyaltyMilestone?.visitTarget ?? 0);
          if (Number.isFinite(milestoneTarget) && milestoneTarget > 0 && !pendingCodeByVisitTarget.has(milestoneTarget)) {
            pendingCodeByVisitTarget.set(milestoneTarget, redemption.code);
          }
          const snapshotLabel = normalizeRewardLabel(redemption.rewardSnapshot);
          if (snapshotLabel && !pendingCodeByRewardLabel.has(snapshotLabel)) {
            pendingCodeByRewardLabel.set(snapshotLabel, redemption.code);
          }
          const fullRewardLabel = normalizeRewardLabel(
            `${redemption.loyaltyMilestone?.emoji ? `${redemption.loyaltyMilestone.emoji} ` : ''}${redemption.loyaltyMilestone?.reward ?? ''}`,
          );
          if (fullRewardLabel && !pendingCodeByRewardLabel.has(fullRewardLabel)) {
            pendingCodeByRewardLabel.set(fullRewardLabel, redemption.code);
          }
          const matchingMilestone = tenant.loyaltyMilestones.find((milestone) => milestone.id === milestoneId);
          if (matchingMilestone && !pendingCodeByVisitTarget.has(matchingMilestone.visitTarget)) {
            pendingCodeByVisitTarget.set(matchingMilestone.visitTarget, redemption.code);
            const fullRewardLabel = normalizeRewardLabel(
              `${matchingMilestone.emoji ? `${matchingMilestone.emoji} ` : ''}${matchingMilestone.reward}`,
            );
            if (fullRewardLabel && !pendingCodeByRewardLabel.has(fullRewardLabel)) {
              pendingCodeByRewardLabel.set(fullRewardLabel, redemption.code);
            }
          }
          if (!pendingCodeByMilestone.has(milestoneId)) {
            pendingCodeByMilestone.set(milestoneId, redemption.code);
          }
        });

        business = {
          id: tenant.id,
          name: tenant.name,
          currentVisits: membership?.currentVisits ?? 0,
          requiredVisits: tenant.requiredVisits,
          milestones: tenant.loyaltyMilestones.map(m => ({
            id: m.id,
            visitTarget: m.visitTarget,
            reward: m.reward,
            emoji: m.emoji,
            redeemed: redeemedSet.has(m.id),
            pendingCode:
              pendingCodeByMilestone.get(m.id)
              || pendingCodeByVisitTarget.get(m.visitTarget)
              || pendingCodeByRewardLabel.get(normalizeRewardLabel(`${m.emoji ? `${m.emoji} ` : ''}${m.reward}`))
              || null,
          })),
        };
      }
    }


    const pass = generateCustomerPass(user.id);

    return apiSuccess({
      requestId,
      data: {
        customer_id: user.id,
        name: user.name || 'Cliente Punto IA',
        branding: {
          app: 'Punto IA',
          theme: 'orange-pink',
        },
        qr: {
          token: pass.token,
          value: pass.qrValue,
        },
        business,
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
