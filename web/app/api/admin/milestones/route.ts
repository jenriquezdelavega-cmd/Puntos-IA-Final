import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, asTrimmedString } from '@/app/lib/request-validation';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId') || '';
    const tenantUserId = url.searchParams.get('tenantUserId') || '';
    const tenantSessionToken = url.searchParams.get('tenantSessionToken') || '';

    const access = await requireTenantRoleAccess({
      tenantId,
      tenantUserId,
      tenantSessionToken,
      allowedRoles: ['ADMIN', 'STAFF'],
    });

    if (!access.ok) {
      return apiError({ requestId, status: access.status, code: 'UNAUTHORIZED', message: access.error });
    }

    const milestones = await prisma.loyaltyMilestone.findMany({
      where: { tenantId: access.tenantId },
      orderBy: { visitTarget: 'asc' },
      select: { id: true, visitTarget: true, reward: true, emoji: true, sortOrder: true },
    });

    return apiSuccess({ requestId, data: { milestones } });
  } catch (e: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Error',
    });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const tenantId = asTrimmedString(body.tenantId);
    const tenantUserId = asTrimmedString(body.tenantUserId);
    const tenantSessionToken = asTrimmedString(body.tenantSessionToken);

    const access = await requireTenantRoleAccess({
      tenantId,
      tenantUserId,
      tenantSessionToken,
      allowedRoles: ['ADMIN'],
    });

    if (!access.ok) {
      return apiError({ requestId, status: access.status, code: 'UNAUTHORIZED', message: access.error });
    }

    // Fetch the tenant to check requiredVisits
    const tenant = await prisma.tenant.findUnique({
      where: { id: access.tenantId },
      select: { requiredVisits: true },
    });

    if (!tenant) {
      return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Negocio no encontrado' });
    }

    const { requiredVisits } = tenant;

    const rawMilestones = body.milestones;
    if (!Array.isArray(rawMilestones)) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'milestones debe ser un arreglo' });
    }

    // Validate and normalize each milestone
    type MilestoneInput = { visitTarget: number; reward: string; emoji: string };
    const parsed: MilestoneInput[] = [];
    for (const item of rawMilestones) {
      if (typeof item !== 'object' || item === null) continue;
      const rec = item as Record<string, unknown>;
      const visitTarget = parseInt(String(rec.visitTarget ?? ''), 10);
      const reward = asTrimmedString(rec.reward);
      const emoji = asTrimmedString(rec.emoji) || '🎁';

      if (isNaN(visitTarget) || visitTarget < 1) {
        return apiError({
          requestId,
          status: 400,
          code: 'BAD_REQUEST',
          message: `visitTarget inválido: ${String(rec.visitTarget)}`,
        });
      }
      if (visitTarget >= requiredVisits) {
        return apiError({
          requestId,
          status: 400,
          code: 'BAD_REQUEST',
          message: `El premio intermedio (visita ${visitTarget}) no puede ser igual o mayor a la meta final (${requiredVisits}).`,
        });
      }
      if (!reward) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'reward no puede estar vacío' });
      }
      parsed.push({ visitTarget, reward, emoji });
    }

    if (parsed.length > 20) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Máximo 20 hitos por negocio' });
    }

    // Upsert: delete existing and re-create in a transaction
    const milestones = await prisma.$transaction(async (tx) => {
      await tx.loyaltyMilestone.deleteMany({ where: { tenantId: access.tenantId } });
      if (parsed.length === 0) return [];
      return tx.loyaltyMilestone.createMany({
        data: parsed.map((item, idx) => ({
          tenantId: access.tenantId,
          visitTarget: item.visitTarget,
          reward: item.reward,
          emoji: item.emoji,
          sortOrder: idx,
        })),
      });
    });

    // Return updated list
    const updated = await prisma.loyaltyMilestone.findMany({
      where: { tenantId: access.tenantId },
      orderBy: { visitTarget: 'asc' },
      select: { id: true, visitTarget: true, reward: true, emoji: true, sortOrder: true },
    });

    return apiSuccess({ requestId, data: { milestones: updated, count: milestones } });
  } catch (e: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Error',
    });
  }
}
