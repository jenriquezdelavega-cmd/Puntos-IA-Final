import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, asTrimmedString } from '@/app/lib/request-validation';
import { validateMilestonesPayload } from '@/app/lib/loyalty-milestones';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { requestWalletRefreshForTenant } from '@/app/lib/wallet-sync-orchestrator';

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

    const validation = validateMilestonesPayload(rawMilestones, requiredVisits);
    if (!validation.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: validation.message });
    }

    // Upsert: delete existing and re-create in a transaction
    const milestones = await prisma.$transaction(async (tx) => {
      await tx.loyaltyMilestone.deleteMany({ where: { tenantId: access.tenantId } });
      if (validation.milestones.length === 0) return [];
      return tx.loyaltyMilestone.createMany({
        data: validation.milestones.map((item, idx) => ({
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

    try {
      const walletRequest = await requestWalletRefreshForTenant({
        prisma,
        tenantId: access.tenantId,
        origin: new URL(request.url).origin,
        reason: 'milestones',
      });

      logApiEvent('/api/admin/milestones#wallet-sync', 'refresh_requested', {
        tenantId: access.tenantId,
        mode: walletRequest.mode,
        jobId: 'jobId' in walletRequest ? walletRequest.jobId : null,
      });
    } catch (walletSyncError) {
      logApiError('/api/admin/milestones#wallet-sync', walletSyncError);
    }

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
