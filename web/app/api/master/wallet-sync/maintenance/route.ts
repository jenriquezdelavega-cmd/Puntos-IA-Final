import { prisma } from '@/app/lib/prisma';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { readWalletSyncRuntimeConfig, runWalletSyncMaintenance } from '@/app/lib/wallet-sync-config';

export const runtime = 'nodejs';

function isAuthorized(request: Request) {
  const expected = String(
    process.env.WALLET_SYNC_MAINTENANCE_SECRET ||
    process.env.WALLET_SYNC_WORKER_SECRET ||
    '',
  ).trim();
  if (!expected) return false;
  const provided = String(request.headers.get('x-wallet-sync-maintenance-secret') || '').trim();
  return provided && provided === expected;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    if (!isAuthorized(request)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const config = await readWalletSyncRuntimeConfig(prisma);
    const nowUtcHour = new Date().getUTCHours();

    if (!config.maintenanceEnabled) {
      return apiSuccess({ requestId, data: { skipped: true, reason: 'maintenance_disabled', config } });
    }
    if (nowUtcHour !== config.maintenanceHourUtc) {
      return apiSuccess({
        requestId,
        data: { skipped: true, reason: 'outside_maintenance_window', nowUtcHour, config },
      });
    }

    const result = await runWalletSyncMaintenance(prisma, config);
    return apiSuccess({
      requestId,
      data: {
        skipped: false,
        nowUtcHour,
        ...result,
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error en maintenance wallet sync',
    });
  }
}
