import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import { requestWalletRefreshForTenant } from '@/app/lib/wallet-sync-orchestrator';
import { logApiError } from '@/app/lib/api-log';

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

    const refreshResult = await requestWalletRefreshForTenant({
      prisma,
      tenantId: access.tenantId,
      origin: new URL(request.url).origin,
      reason: 'tenant-settings',
      forceImmediate: true,
    });

    return apiSuccess({
      requestId,
      data: {
        ok: true,
        mode: refreshResult.mode,
        jobId: 'jobId' in refreshResult ? refreshResult.jobId : null,
      },
    });
  } catch (error) {
    logApiError('/api/admin/wallet-refresh', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
