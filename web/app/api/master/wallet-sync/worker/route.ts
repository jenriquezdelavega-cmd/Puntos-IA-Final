import { prisma } from '@/app/lib/prisma';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  claimWalletSyncJobs,
  markWalletSyncJobCompleted,
  markWalletSyncJobFailed,
  readWalletSyncRuntimeConfig,
} from '@/app/lib/wallet-sync-config';
import { refreshWalletsForTenant } from '@/app/lib/wallet-sync-orchestrator';

export const runtime = 'nodejs';

function isAuthorized(request: Request) {
  const expected = String(process.env.WALLET_SYNC_WORKER_SECRET || '').trim();
  if (!expected) return false;
  const provided = String(request.headers.get('x-wallet-sync-worker-secret') || '').trim();
  return provided && provided === expected;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    if (!isAuthorized(request)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const config = await readWalletSyncRuntimeConfig(prisma);
    if (!config.workerEnabled) {
      return apiSuccess({
        requestId,
        data: { processed: 0, succeeded: 0, failed: 0, skipped: true, reason: 'worker_disabled' },
      });
    }

    const claimed = await claimWalletSyncJobs({
      prisma,
      limit: config.workerBatchSize,
      staleLockAfterMinutes: config.workerLockTimeoutMinutes,
    });

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const job of claimed) {
      processed += 1;
      try {
        await refreshWalletsForTenant({
          prisma,
          tenantId: job.tenant_id,
          origin: job.origin,
          reason: job.reason,
        });
        await markWalletSyncJobCompleted(prisma, job.id);
        succeeded += 1;
      } catch (error: unknown) {
        await markWalletSyncJobFailed({
          prisma,
          jobId: job.id,
          attempts: job.attempts,
          maxAttempts: job.max_attempts,
          retryDelaySeconds: config.workerRetryDelaySeconds,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        failed += 1;
      }
    }

    return apiSuccess({
      requestId,
      data: {
        processed,
        succeeded,
        failed,
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error en worker de wallet sync',
    });
  }
}
