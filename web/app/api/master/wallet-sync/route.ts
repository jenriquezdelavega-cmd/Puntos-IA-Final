import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { consumeRateLimit, getClientIp } from '@/app/lib/request-rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import {
  claimWalletSyncJobs,
  ensureWalletSyncTables,
  markWalletSyncJobCompleted,
  markWalletSyncJobFailed,
  readWalletSyncAuditLogs,
  readWalletSyncJobs,
  readWalletSyncRuntimeConfig,
  runWalletSyncMaintenance,
  writeWalletSyncRuntimeConfig,
} from '@/app/lib/wallet-sync-config';
import { refreshWalletsForTenant } from '@/app/lib/wallet-sync-orchestrator';

type Action = 'LIST' | 'UPDATE' | 'RUN_JOBS' | 'RUN_MAINTENANCE';

function parseAction(value: unknown): Action {
  const raw = asTrimmedString(value).toUpperCase();
  if (raw === 'RUN_JOBS') return 'RUN_JOBS';
  if (raw === 'RUN_MAINTENANCE') return 'RUN_MAINTENANCE';
  if (raw === 'UPDATE') return 'UPDATE';
  return 'LIST';
}

function asOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  const normalized = asTrimmedString(value).toLowerCase();
  if (!normalized) return undefined;
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return undefined;
}

function asOptionalInt(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.floor(parsed);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const clientIp = getClientIp(request);

  try {
    const rateLimit = consumeRateLimit(`master:wallet-sync:${clientIp}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'TOO_MANY_REQUESTS',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${String(rateLimit.retryAfterSeconds)}s.`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const masterUsername = asTrimmedString(body.masterUsername);
    const masterPassword = asTrimmedString(body.masterPassword);
    const masterOtp = asTrimmedString(body.masterOtp);
    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    await ensureWalletSyncTables(prisma);
    const action = parseAction(body.action);

    if (action === 'UPDATE') {
      const updatedConfig = await writeWalletSyncRuntimeConfig(prisma, {
        appleEnabled: asOptionalBoolean(body.appleEnabled),
        googleEnabled: asOptionalBoolean(body.googleEnabled),
        appleTouchConcurrency: asOptionalInt(body.appleTouchConcurrency),
        applePushConcurrency: asOptionalInt(body.applePushConcurrency),
        googleSyncMaxCustomers: asOptionalInt(body.googleSyncMaxCustomers),
        alertErrorThreshold: asOptionalInt(body.alertErrorThreshold),
        alertWindowMinutes: asOptionalInt(body.alertWindowMinutes),
        executionMode: asTrimmedString(body.executionMode) === 'immediate' ? 'immediate' : (asTrimmedString(body.executionMode) === 'queued' ? 'queued' : undefined),
        workerBatchSize: asOptionalInt(body.workerBatchSize),
        workerMaxAttempts: asOptionalInt(body.workerMaxAttempts),
        workerRetryDelaySeconds: asOptionalInt(body.workerRetryDelaySeconds),
        workerEnabled: asOptionalBoolean(body.workerEnabled),
        workerLockTimeoutMinutes: asOptionalInt(body.workerLockTimeoutMinutes),
        maintenanceEnabled: asOptionalBoolean(body.maintenanceEnabled),
        maintenanceHourUtc: asOptionalInt(body.maintenanceHourUtc),
        auditRetentionDays: asOptionalInt(body.auditRetentionDays),
        jobRetentionDays: asOptionalInt(body.jobRetentionDays),
      });

      const [logs, jobs] = await Promise.all([
        readWalletSyncAuditLogs(prisma, { limit: asOptionalInt(body.limit) ?? 120 }),
        readWalletSyncJobs(prisma, { limit: asOptionalInt(body.jobsLimit) ?? 120 }),
      ]);
      return apiSuccess({
        requestId,
        data: {
          config: updatedConfig,
          logs,
          jobs,
        },
      });
    }

    if (action === 'RUN_JOBS') {
      const config = await readWalletSyncRuntimeConfig(prisma);
      if (!config.workerEnabled && body.forceRun !== true) {
        return apiSuccess({
          requestId,
          data: {
            processed: 0,
            succeeded: 0,
            failed: 0,
            skipped: true,
            reason: 'worker_disabled',
            config,
          },
        });
      }
      const claimed = await claimWalletSyncJobs({
        prisma,
        limit: asOptionalInt(body.batchSize) ?? config.workerBatchSize,
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

      const [logs, jobs] = await Promise.all([
        readWalletSyncAuditLogs(prisma, { limit: asOptionalInt(body.limit) ?? 120 }),
        readWalletSyncJobs(prisma, { limit: asOptionalInt(body.jobsLimit) ?? 120 }),
      ]);
      return apiSuccess({
        requestId,
        data: {
          processed,
          succeeded,
          failed,
          logs,
          jobs,
          config,
        },
      });
    }

    if (action === 'RUN_MAINTENANCE') {
      const config = await readWalletSyncRuntimeConfig(prisma);
      const nowUtcHour = new Date().getUTCHours();
      const forceRun = body.forceRun === true;

      if (!forceRun) {
        if (!config.maintenanceEnabled) {
          return apiSuccess({
            requestId,
            data: { skipped: true, reason: 'maintenance_disabled', config },
          });
        }
        if (nowUtcHour !== config.maintenanceHourUtc) {
          return apiSuccess({
            requestId,
            data: { skipped: true, reason: 'outside_maintenance_window', nowUtcHour, config },
          });
        }
      }

      const result = await runWalletSyncMaintenance(prisma, config);
      return apiSuccess({
        requestId,
        data: {
          skipped: false,
          nowUtcHour,
          ...result,
          config,
        },
      });
    }

    const config = await readWalletSyncRuntimeConfig(prisma);
    const [logs, jobs] = await Promise.all([
      readWalletSyncAuditLogs(prisma, {
        limit: asOptionalInt(body.limit) ?? 120,
        tenantId: asTrimmedString(body.tenantId) || undefined,
      }),
      readWalletSyncJobs(prisma, { limit: asOptionalInt(body.jobsLimit) ?? 120 }),
    ]);

    const windowStart = new Date(Date.now() - config.alertWindowMinutes * 60_000).toISOString();
    const recentErrorRows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::int AS count
        FROM wallet_sync_audit_logs
        WHERE status = 'error'
          AND created_at >= $1::timestamptz
      `,
      windowStart,
    );
    const recentErrors = Number(recentErrorRows[0]?.count || 0);

    const [auditStatusRows, jobStatusRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ status: string; count: number }>>(
        `
          SELECT status, COUNT(*)::int AS count
          FROM wallet_sync_audit_logs
          WHERE created_at >= NOW() - interval '24 hours'
          GROUP BY status
        `,
      ),
      prisma.$queryRawUnsafe<Array<{ status: string; count: number }>>(
        `
          SELECT status, COUNT(*)::int AS count
          FROM wallet_sync_jobs
          GROUP BY status
        `,
      ),
    ]);

    const auditStatusCounts = Object.fromEntries(
      auditStatusRows.map((row) => [row.status, Number(row.count || 0)]),
    ) as Record<string, number>;
    const jobStatusCounts = Object.fromEntries(
      jobStatusRows.map((row) => [row.status, Number(row.count || 0)]),
    ) as Record<string, number>;

    const alerts = recentErrors >= config.alertErrorThreshold
      ? [
          {
            id: 'wallet-sync-error-rate',
            severity: 'high',
            message: `Se detectaron ${recentErrors} errores de sincronización en los últimos ${config.alertWindowMinutes} minutos.`,
          },
        ]
      : [];

    return apiSuccess({
      requestId,
      data: {
        config,
        logs,
        jobs,
        alerts,
        metrics: {
          recentErrors,
          alertThreshold: config.alertErrorThreshold,
          alertWindowMinutes: config.alertWindowMinutes,
          auditLast24h: {
            success: auditStatusCounts.success || 0,
            error: auditStatusCounts.error || 0,
            skipped: auditStatusCounts.skipped || 0,
          },
          queue: {
            pending: jobStatusCounts.pending || 0,
            running: jobStatusCounts.running || 0,
            failed: jobStatusCounts.failed || 0,
            completed: jobStatusCounts.completed || 0,
          },
        },
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error al administrar wallet sync',
    });
  }
}
