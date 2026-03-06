import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

function futureDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      masterUsername: requiredString,
      masterPassword: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword } = parsedBody.data;
    if (!isValidMasterCredentials(masterUsername, masterPassword)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const requestedTenantIds = Array.isArray(body.tenantIds)
      ? body.tenantIds.map((value) => asTrimmedString(value)).filter(Boolean)
      : [];

    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        coalitionOptIn: true,
        coalitionDiscountPercent: { gte: 10 },
        coalitionProduct: { not: '' },
        ...(requestedTenantIds.length > 0 ? { id: { in: requestedTenantIds } } : {}),
      },
      select: { id: true, name: true, coalitionDiscountPercent: true, coalitionProduct: true },
      orderBy: { createdAt: 'asc' },
      take: requestedTenantIds.length > 0 ? undefined : 3,
    });

    if (tenants.length === 0) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'No hay negocios activos adheridos a coalición (mínimo 10% + producto) para crear recompensas de retos',
      });
    }

    const tenantA = tenants[0];
    const tenantB = tenants[Math.min(1, tenants.length - 1)];
    const tenantC = tenants[Math.min(2, tenants.length - 1)];

    const rewardSpecs = [
      {
        title: '10% de descuento por reto semanal',
        rewardType: 'DISCOUNT_PERCENT',
        rewardValue: `${Math.max(Number(tenantA.coalitionDiscountPercent || 10), 10)}% en ${tenantA.coalitionProduct || 'producto participante'} (${tenantA.name})`,
        businessId: tenantA.id,
      },
      {
        title: 'Cortesía por reto mensual',
        rewardType: 'FREE_ITEM',
        rewardValue: `${Math.max(Number(tenantB.coalitionDiscountPercent || 10), 10)}% en ${tenantB.coalitionProduct || 'producto participante'} (${tenantB.name})`,
        businessId: tenantB.id,
      },
      {
        title: 'Recompensa explorador local',
        rewardType: 'NETWORK_BONUS',
        rewardValue: `${Math.max(Number(tenantC.coalitionDiscountPercent || 10), 10)}% en ${tenantC.coalitionProduct || 'producto participante'} (${tenantC.name})`,
        businessId: tenantC.id,
      },
    ];

    const rewards = [] as Array<{ id: string; title: string; rewardValue: string; businessId: string }>;

    for (const spec of rewardSpecs) {
      const reward = await prisma.coalitionReward.upsert({
        where: {
          id: `${spec.businessId}:${spec.title}`,
        },
        create: {
          id: `${spec.businessId}:${spec.title}`,
          businessId: spec.businessId,
          title: spec.title,
          rewardType: spec.rewardType,
          rewardValue: spec.rewardValue,
          redemptionLimit: 1,
          expiresAt: futureDate(45),
          active: true,
        },
        update: {
          rewardType: spec.rewardType,
          rewardValue: spec.rewardValue,
          redemptionLimit: 1,
          expiresAt: futureDate(45),
          active: true,
        },
        select: { id: true, title: true, rewardValue: true, businessId: true },
      });
      rewards.push(reward);
    }

    const challengeSpecs = [
      {
        title: 'Café de la semana',
        description: 'Registra 1 visita en 7 días para mantener tu rutina local.',
        challengeType: 'VISIT_COUNT' as const,
        targetValue: 1,
        timeWindow: 7,
        rewardCampaignId: rewards[0].id,
      },
      {
        title: 'Corte del mes',
        description: 'Registra 1 visita en 30 días y desbloquea beneficio mensual.',
        challengeType: 'VISIT_COUNT' as const,
        targetValue: 1,
        timeWindow: 30,
        rewardCampaignId: rewards[1].id,
      },
      {
        title: 'Explorador local',
        description: 'Visita 2 negocios distintos de la red en 30 días.',
        challengeType: 'DISTINCT_BUSINESSES' as const,
        targetValue: 2,
        timeWindow: 30,
        rewardCampaignId: rewards[2].id,
      },
    ];

    const challenges = [] as Array<{ id: string; title: string }>;

    for (const spec of challengeSpecs) {
      const challenge = await prisma.challenge.upsert({
        where: { id: spec.title },
        create: {
          id: spec.title,
          title: spec.title,
          description: spec.description,
          challengeType: spec.challengeType,
          targetValue: spec.targetValue,
          timeWindow: spec.timeWindow,
          rewardCampaignId: spec.rewardCampaignId,
          active: true,
        },
        update: {
          description: spec.description,
          challengeType: spec.challengeType,
          targetValue: spec.targetValue,
          timeWindow: spec.timeWindow,
          rewardCampaignId: spec.rewardCampaignId,
          active: true,
        },
        select: { id: true, title: true },
      });
      challenges.push(challenge);
    }

    return apiSuccess({
      requestId,
      data: {
        seededTenants: tenants,
        rewards,
        challenges,
        message: 'Retos locales base y recompensas de coalición listos para demo.',
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno al sembrar retos locales',
    });
  }
}
