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

    type MilestoneData = { id: string; visitTarget: number; reward: string; emoji: string; redeemed: boolean };
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

        // Find which milestones already have a used redemption for this user
        const usedRedemptions = await prisma.redemption.findMany({
          where: {
            userId: user.id,
            tenantId: tenant.id,
            loyaltyMilestoneId: { in: tenant.loyaltyMilestones.map(m => m.id) },
            isUsed: true,
          },
          select: { loyaltyMilestoneId: true },
        });
        const redeemedSet = new Set(usedRedemptions.map(r => r.loyaltyMilestoneId).filter(Boolean));

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
