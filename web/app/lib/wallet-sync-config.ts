import { PrismaClient } from '@prisma/client';

export type WalletSyncReason = 'tenant-settings' | 'milestones';
export type WalletSyncChannel = 'apple' | 'google';
export type WalletSyncStatus = 'success' | 'error' | 'skipped';

export type WalletSyncRuntimeConfig = {
  appleEnabled: boolean;
  googleEnabled: boolean;
  appleTouchConcurrency: number;
  applePushConcurrency: number;
  googleSyncMaxCustomers: number;
  alertErrorThreshold: number;
  alertWindowMinutes: number;
  executionMode: 'immediate' | 'queued';
  workerBatchSize: number;
  workerMaxAttempts: number;
  workerRetryDelaySeconds: number;
  workerEnabled: boolean;
  workerLockTimeoutMinutes: number;
  maintenanceEnabled: boolean;
  maintenanceHourUtc: number;
  auditRetentionDays: number;
  jobRetentionDays: number;
  updatedAt: string | null;
};

const DEFAULTS: Omit<WalletSyncRuntimeConfig, 'updatedAt'> = {
  appleEnabled: true,
  googleEnabled: true,
  appleTouchConcurrency: 10,
  applePushConcurrency: 8,
  googleSyncMaxCustomers: 500,
  alertErrorThreshold: 5,
  alertWindowMinutes: 60,
  executionMode: 'queued',
  workerBatchSize: 50,
  workerMaxAttempts: 5,
  workerRetryDelaySeconds: 60,
  workerEnabled: true,
  workerLockTimeoutMinutes: 15,
  maintenanceEnabled: true,
  maintenanceHourUtc: 8,
  auditRetentionDays: 30,
  jobRetentionDays: 14,
};

function parseBool(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

export async function ensureWalletSyncTables(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS wallet_sync_runtime_config (
      id INTEGER PRIMARY KEY,
      apple_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      google_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      apple_touch_concurrency INTEGER NOT NULL DEFAULT 10,
      apple_push_concurrency INTEGER NOT NULL DEFAULT 8,
      google_sync_max_customers INTEGER NOT NULL DEFAULT 500,
      alert_error_threshold INTEGER NOT NULL DEFAULT 5,
      alert_window_minutes INTEGER NOT NULL DEFAULT 60,
      execution_mode TEXT NOT NULL DEFAULT 'queued',
      worker_batch_size INTEGER NOT NULL DEFAULT 50,
      worker_max_attempts INTEGER NOT NULL DEFAULT 5,
      worker_retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
      worker_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      worker_lock_timeout_minutes INTEGER NOT NULL DEFAULT 15,
      maintenance_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      maintenance_hour_utc INTEGER NOT NULL DEFAULT 8,
      audit_retention_days INTEGER NOT NULL DEFAULT 30,
      job_retention_days INTEGER NOT NULL DEFAULT 14,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'queued'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS worker_batch_size INTEGER NOT NULL DEFAULT 50`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS worker_max_attempts INTEGER NOT NULL DEFAULT 5`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS worker_retry_delay_seconds INTEGER NOT NULL DEFAULT 60`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS worker_enabled BOOLEAN NOT NULL DEFAULT TRUE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS worker_lock_timeout_minutes INTEGER NOT NULL DEFAULT 15`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS maintenance_enabled BOOLEAN NOT NULL DEFAULT TRUE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS maintenance_hour_utc INTEGER NOT NULL DEFAULT 8`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS audit_retention_days INTEGER NOT NULL DEFAULT 30`);
  await prisma.$executeRawUnsafe(`ALTER TABLE wallet_sync_runtime_config ADD COLUMN IF NOT EXISTS job_retention_days INTEGER NOT NULL DEFAULT 14`);

  await prisma.$executeRawUnsafe(`
    INSERT INTO wallet_sync_runtime_config (
      id,
      apple_enabled,
      google_enabled,
      apple_touch_concurrency,
      apple_push_concurrency,
      google_sync_max_customers,
      alert_error_threshold,
      alert_window_minutes,
      execution_mode,
      worker_batch_size,
      worker_max_attempts,
      worker_retry_delay_seconds,
      worker_enabled,
      worker_lock_timeout_minutes,
      maintenance_enabled,
      maintenance_hour_utc,
      audit_retention_days,
      job_retention_days,
      updated_at
    )
    VALUES (1, TRUE, TRUE, 10, 8, 500, 5, 60, 'queued', 50, 5, 60, TRUE, 15, TRUE, 8, 30, 14, NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS wallet_sync_audit_logs (
      id BIGSERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_wallet_sync_audit_logs_created_at
    ON wallet_sync_audit_logs (created_at DESC)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS wallet_sync_jobs (
      id BIGSERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      origin TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      locked_at TIMESTAMPTZ NULL,
      last_error TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_wallet_sync_jobs_status_run_after
    ON wallet_sync_jobs (status, run_after ASC)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_sync_jobs_open_unique
    ON wallet_sync_jobs (tenant_id, reason)
    WHERE status IN ('pending', 'running')
  `);
}

export async function readWalletSyncRuntimeConfig(prisma: PrismaClient): Promise<WalletSyncRuntimeConfig> {
  await ensureWalletSyncTables(prisma);

  const envDefaults = {
    appleEnabled: parseBool(process.env.WALLET_SYNC_APPLE_ENABLED, DEFAULTS.appleEnabled),
    googleEnabled: parseBool(process.env.WALLET_SYNC_GOOGLE_ENABLED, DEFAULTS.googleEnabled),
    appleTouchConcurrency: clampInt(process.env.WALLET_SYNC_APPLE_TOUCH_CONCURRENCY, 1, 20, DEFAULTS.appleTouchConcurrency),
    applePushConcurrency: clampInt(process.env.WALLET_SYNC_APPLE_PUSH_CONCURRENCY, 1, 20, DEFAULTS.applePushConcurrency),
    googleSyncMaxCustomers: clampInt(process.env.WALLET_SYNC_GOOGLE_MAX_CUSTOMERS, 10, 5000, DEFAULTS.googleSyncMaxCustomers),
    alertErrorThreshold: clampInt(process.env.WALLET_SYNC_ALERT_ERROR_THRESHOLD, 1, 1000, DEFAULTS.alertErrorThreshold),
    alertWindowMinutes: clampInt(process.env.WALLET_SYNC_ALERT_WINDOW_MINUTES, 5, 1440, DEFAULTS.alertWindowMinutes),
    executionMode: process.env.WALLET_SYNC_EXECUTION_MODE === 'immediate' ? 'immediate' : DEFAULTS.executionMode,
    workerBatchSize: clampInt(process.env.WALLET_SYNC_WORKER_BATCH_SIZE, 1, 500, DEFAULTS.workerBatchSize),
    workerMaxAttempts: clampInt(process.env.WALLET_SYNC_WORKER_MAX_ATTEMPTS, 1, 20, DEFAULTS.workerMaxAttempts),
    workerRetryDelaySeconds: clampInt(process.env.WALLET_SYNC_WORKER_RETRY_DELAY_SECONDS, 10, 86400, DEFAULTS.workerRetryDelaySeconds),
    workerEnabled: parseBool(process.env.WALLET_SYNC_WORKER_ENABLED, DEFAULTS.workerEnabled),
    workerLockTimeoutMinutes: clampInt(process.env.WALLET_SYNC_WORKER_LOCK_TIMEOUT_MINUTES, 1, 240, DEFAULTS.workerLockTimeoutMinutes),
    maintenanceEnabled: parseBool(process.env.WALLET_SYNC_MAINTENANCE_ENABLED, DEFAULTS.maintenanceEnabled),
    maintenanceHourUtc: clampInt(process.env.WALLET_SYNC_MAINTENANCE_HOUR_UTC, 0, 23, DEFAULTS.maintenanceHourUtc),
    auditRetentionDays: clampInt(process.env.WALLET_SYNC_AUDIT_RETENTION_DAYS, 1, 365, DEFAULTS.auditRetentionDays),
    jobRetentionDays: clampInt(process.env.WALLET_SYNC_JOB_RETENTION_DAYS, 1, 365, DEFAULTS.jobRetentionDays),
  };

  const rows = await prisma.$queryRawUnsafe<Array<{
    apple_enabled: boolean;
    google_enabled: boolean;
    apple_touch_concurrency: number;
    apple_push_concurrency: number;
    google_sync_max_customers: number;
    alert_error_threshold: number;
    alert_window_minutes: number;
    execution_mode: string;
    worker_batch_size: number;
    worker_max_attempts: number;
    worker_retry_delay_seconds: number;
    worker_enabled: boolean;
    worker_lock_timeout_minutes: number;
    maintenance_enabled: boolean;
    maintenance_hour_utc: number;
    audit_retention_days: number;
    job_retention_days: number;
    updated_at: Date;
  }>>(
    `
      SELECT
        apple_enabled,
        google_enabled,
        apple_touch_concurrency,
        apple_push_concurrency,
        google_sync_max_customers,
        alert_error_threshold,
        alert_window_minutes,
        execution_mode,
        worker_batch_size,
        worker_max_attempts,
        worker_retry_delay_seconds,
        worker_enabled,
        worker_lock_timeout_minutes,
        maintenance_enabled,
        maintenance_hour_utc,
        audit_retention_days,
        job_retention_days,
        updated_at
      FROM wallet_sync_runtime_config
      WHERE id = 1
      LIMIT 1
    `
  );

  const db = rows[0];
  if (!db) return { ...envDefaults, updatedAt: null };

  return {
    appleEnabled: typeof db.apple_enabled === 'boolean' ? db.apple_enabled : envDefaults.appleEnabled,
    googleEnabled: typeof db.google_enabled === 'boolean' ? db.google_enabled : envDefaults.googleEnabled,
    appleTouchConcurrency: clampInt(db.apple_touch_concurrency, 1, 20, envDefaults.appleTouchConcurrency),
    applePushConcurrency: clampInt(db.apple_push_concurrency, 1, 20, envDefaults.applePushConcurrency),
    googleSyncMaxCustomers: clampInt(db.google_sync_max_customers, 10, 5000, envDefaults.googleSyncMaxCustomers),
    alertErrorThreshold: clampInt(db.alert_error_threshold, 1, 1000, envDefaults.alertErrorThreshold),
    alertWindowMinutes: clampInt(db.alert_window_minutes, 5, 1440, envDefaults.alertWindowMinutes),
    executionMode: db.execution_mode === 'immediate' ? 'immediate' : 'queued',
    workerBatchSize: clampInt(db.worker_batch_size, 1, 500, envDefaults.workerBatchSize),
    workerMaxAttempts: clampInt(db.worker_max_attempts, 1, 20, envDefaults.workerMaxAttempts),
    workerRetryDelaySeconds: clampInt(db.worker_retry_delay_seconds, 10, 86400, envDefaults.workerRetryDelaySeconds),
    workerEnabled: typeof db.worker_enabled === 'boolean' ? db.worker_enabled : envDefaults.workerEnabled,
    workerLockTimeoutMinutes: clampInt(db.worker_lock_timeout_minutes, 1, 240, envDefaults.workerLockTimeoutMinutes),
    maintenanceEnabled: typeof db.maintenance_enabled === 'boolean' ? db.maintenance_enabled : envDefaults.maintenanceEnabled,
    maintenanceHourUtc: clampInt(db.maintenance_hour_utc, 0, 23, envDefaults.maintenanceHourUtc),
    auditRetentionDays: clampInt(db.audit_retention_days, 1, 365, envDefaults.auditRetentionDays),
    jobRetentionDays: clampInt(db.job_retention_days, 1, 365, envDefaults.jobRetentionDays),
    updatedAt: db.updated_at ? new Date(db.updated_at).toISOString() : null,
  };
}

export async function writeWalletSyncRuntimeConfig(
  prisma: PrismaClient,
  patch: Partial<Omit<WalletSyncRuntimeConfig, 'updatedAt'>>,
) {
  const current = await readWalletSyncRuntimeConfig(prisma);
  const next = {
    appleEnabled: patch.appleEnabled ?? current.appleEnabled,
    googleEnabled: patch.googleEnabled ?? current.googleEnabled,
    appleTouchConcurrency: clampInt(patch.appleTouchConcurrency, 1, 20, current.appleTouchConcurrency),
    applePushConcurrency: clampInt(patch.applePushConcurrency, 1, 20, current.applePushConcurrency),
    googleSyncMaxCustomers: clampInt(patch.googleSyncMaxCustomers, 10, 5000, current.googleSyncMaxCustomers),
    alertErrorThreshold: clampInt(patch.alertErrorThreshold, 1, 1000, current.alertErrorThreshold),
    alertWindowMinutes: clampInt(patch.alertWindowMinutes, 5, 1440, current.alertWindowMinutes),
    executionMode: patch.executionMode === 'immediate' ? 'immediate' : (patch.executionMode === 'queued' ? 'queued' : current.executionMode),
    workerBatchSize: clampInt(patch.workerBatchSize, 1, 500, current.workerBatchSize),
    workerMaxAttempts: clampInt(patch.workerMaxAttempts, 1, 20, current.workerMaxAttempts),
    workerRetryDelaySeconds: clampInt(patch.workerRetryDelaySeconds, 10, 86400, current.workerRetryDelaySeconds),
    workerEnabled: patch.workerEnabled ?? current.workerEnabled,
    workerLockTimeoutMinutes: clampInt(patch.workerLockTimeoutMinutes, 1, 240, current.workerLockTimeoutMinutes),
    maintenanceEnabled: patch.maintenanceEnabled ?? current.maintenanceEnabled,
    maintenanceHourUtc: clampInt(patch.maintenanceHourUtc, 0, 23, current.maintenanceHourUtc),
    auditRetentionDays: clampInt(patch.auditRetentionDays, 1, 365, current.auditRetentionDays),
    jobRetentionDays: clampInt(patch.jobRetentionDays, 1, 365, current.jobRetentionDays),
  };

  await prisma.$executeRawUnsafe(
    `
      UPDATE wallet_sync_runtime_config
      SET
        apple_enabled = $1,
        google_enabled = $2,
        apple_touch_concurrency = $3,
        apple_push_concurrency = $4,
        google_sync_max_customers = $5,
        alert_error_threshold = $6,
        alert_window_minutes = $7,
        execution_mode = $8,
        worker_batch_size = $9,
        worker_max_attempts = $10,
        worker_retry_delay_seconds = $11,
        worker_enabled = $12,
        worker_lock_timeout_minutes = $13,
        maintenance_enabled = $14,
        maintenance_hour_utc = $15,
        audit_retention_days = $16,
        job_retention_days = $17,
        updated_at = NOW()
      WHERE id = 1
    `,
    next.appleEnabled,
    next.googleEnabled,
    next.appleTouchConcurrency,
    next.applePushConcurrency,
    next.googleSyncMaxCustomers,
    next.alertErrorThreshold,
    next.alertWindowMinutes,
    next.executionMode,
    next.workerBatchSize,
    next.workerMaxAttempts,
    next.workerRetryDelaySeconds,
    next.workerEnabled,
    next.workerLockTimeoutMinutes,
    next.maintenanceEnabled,
    next.maintenanceHourUtc,
    next.auditRetentionDays,
    next.jobRetentionDays,
  );

  return readWalletSyncRuntimeConfig(prisma);
}

export async function appendWalletSyncAuditLog(params: {
  prisma: PrismaClient;
  tenantId: string;
  reason: WalletSyncReason;
  channel: WalletSyncChannel;
  status: WalletSyncStatus;
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureWalletSyncTables(params.prisma);
  await params.prisma.$executeRawUnsafe(
    `
      INSERT INTO wallet_sync_audit_logs (tenant_id, reason, channel, status, message, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
    `,
    params.tenantId,
    params.reason,
    params.channel,
    params.status,
    String(params.message || ''),
    JSON.stringify(params.metadata || {}),
  );
}

export async function readWalletSyncAuditLogs(prisma: PrismaClient, options?: { limit?: number; tenantId?: string }) {
  await ensureWalletSyncTables(prisma);
  const limit = clampInt(options?.limit, 1, 500, 120);
  const tenantId = (options?.tenantId || '').trim();

  if (tenantId) {
    return prisma.$queryRawUnsafe<Array<{
      id: number;
      tenant_id: string;
      reason: string;
      channel: string;
      status: string;
      message: string;
      metadata: unknown;
      created_at: Date;
    }>>(
      `
        SELECT id, tenant_id, reason, channel, status, message, metadata, created_at
        FROM wallet_sync_audit_logs
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      tenantId,
      limit,
    );
  }

  return prisma.$queryRawUnsafe<Array<{
    id: number;
    tenant_id: string;
    reason: string;
    channel: string;
    status: string;
    message: string;
    metadata: unknown;
    created_at: Date;
  }>>(
    `
      SELECT id, tenant_id, reason, channel, status, message, metadata, created_at
      FROM wallet_sync_audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    limit,
  );
}

export async function enqueueWalletSyncJob(params: {
  prisma: PrismaClient;
  tenantId: string;
  reason: WalletSyncReason;
  origin: string;
  maxAttempts: number;
}) {
  await ensureWalletSyncTables(params.prisma);
  const existing = await params.prisma.$queryRawUnsafe<Array<{ id: number }>>(
    `
      SELECT id
      FROM wallet_sync_jobs
      WHERE tenant_id = $1
        AND reason = $2
        AND status IN ('pending', 'running')
      ORDER BY id DESC
      LIMIT 1
    `,
    params.tenantId,
    params.reason,
  );
  if (existing.length > 0) {
    return Number(existing[0].id);
  }

  const rows = await params.prisma.$queryRawUnsafe<Array<{ id: number }>>(
    `
      INSERT INTO wallet_sync_jobs (tenant_id, reason, origin, status, attempts, max_attempts, run_after, created_at, updated_at)
      VALUES ($1, $2, $3, 'pending', 0, $4, NOW(), NOW(), NOW())
      RETURNING id
    `,
    params.tenantId,
    params.reason,
    params.origin,
    clampInt(params.maxAttempts, 1, 20, 5),
  );

  return Number(rows[0]?.id || 0);
}

export async function claimWalletSyncJobs(params: {
  prisma: PrismaClient;
  limit: number;
  staleLockAfterMinutes?: number;
}) {
  await ensureWalletSyncTables(params.prisma);
  const safeLimit = clampInt(params.limit, 1, 500, 50);
  const staleLockAfterMinutes = clampInt(params.staleLockAfterMinutes, 1, 240, 15);

  await params.prisma.$executeRawUnsafe(
    `
      UPDATE wallet_sync_jobs
      SET
        status = 'pending',
        locked_at = NULL,
        run_after = NOW(),
        updated_at = NOW(),
        last_error = CASE
          WHEN last_error = '' THEN 'Recovered stale running job'
          ELSE left(last_error || ' | Recovered stale running job', 1500)
        END
      WHERE status = 'running'
        AND locked_at IS NOT NULL
        AND locked_at < NOW() - ($1::int * interval '1 minute')
    `,
    staleLockAfterMinutes,
  );

  return params.prisma.$queryRawUnsafe<Array<{
    id: number;
    tenant_id: string;
    reason: WalletSyncReason;
    origin: string;
    attempts: number;
    max_attempts: number;
  }>>(
    `
      WITH picked AS (
        SELECT id
        FROM wallet_sync_jobs
        WHERE status = 'pending'
          AND run_after <= NOW()
        ORDER BY run_after ASC, id ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE wallet_sync_jobs jobs
      SET
        status = 'running',
        locked_at = NOW(),
        attempts = jobs.attempts + 1,
        updated_at = NOW()
      FROM picked
      WHERE jobs.id = picked.id
      RETURNING jobs.id, jobs.tenant_id, jobs.reason, jobs.origin, jobs.attempts, jobs.max_attempts
    `,
    safeLimit,
  );
}

export async function markWalletSyncJobCompleted(prisma: PrismaClient, jobId: number) {
  await prisma.$executeRawUnsafe(
    `
      UPDATE wallet_sync_jobs
      SET
        status = 'completed',
        locked_at = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    jobId,
  );
}

export async function markWalletSyncJobFailed(params: {
  prisma: PrismaClient;
  jobId: number;
  attempts: number;
  maxAttempts: number;
  retryDelaySeconds: number;
  errorMessage: string;
}) {
  const shouldRetry = params.attempts < params.maxAttempts;
  if (shouldRetry) {
    await params.prisma.$executeRawUnsafe(
      `
        UPDATE wallet_sync_jobs
        SET
          status = 'pending',
          locked_at = NULL,
          run_after = NOW() + ($2::int * interval '1 second'),
          last_error = $3,
          updated_at = NOW()
        WHERE id = $1
      `,
      params.jobId,
      clampInt(params.retryDelaySeconds, 10, 86400, 60),
      params.errorMessage.slice(0, 1500),
    );
    return;
  }

  await params.prisma.$executeRawUnsafe(
    `
      UPDATE wallet_sync_jobs
      SET
        status = 'failed',
        locked_at = NULL,
        last_error = $2,
        updated_at = NOW()
      WHERE id = $1
    `,
    params.jobId,
    params.errorMessage.slice(0, 1500),
  );
}

export async function readWalletSyncJobs(prisma: PrismaClient, options?: { limit?: number }) {
  await ensureWalletSyncTables(prisma);
  const limit = clampInt(options?.limit, 1, 500, 120);
  return prisma.$queryRawUnsafe<Array<{
    id: number;
    tenant_id: string;
    reason: string;
    origin: string;
    status: string;
    attempts: number;
    max_attempts: number;
    run_after: Date;
    last_error: string;
    created_at: Date;
    updated_at: Date;
  }>>(
    `
      SELECT
        id, tenant_id, reason, origin, status, attempts, max_attempts,
        run_after, last_error, created_at, updated_at
      FROM wallet_sync_jobs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    limit,
  );
}

export async function runWalletSyncMaintenance(prisma: PrismaClient, config: WalletSyncRuntimeConfig) {
  await ensureWalletSyncTables(prisma);
  const auditRetentionDays = clampInt(config.auditRetentionDays, 1, 365, 30);
  const jobRetentionDays = clampInt(config.jobRetentionDays, 1, 365, 14);

  const deletedAuditRows = await prisma.$executeRawUnsafe(
    `
      DELETE FROM wallet_sync_audit_logs
      WHERE created_at < NOW() - ($1::int * interval '1 day')
    `,
    auditRetentionDays,
  );

  const deletedCompletedJobs = await prisma.$executeRawUnsafe(
    `
      DELETE FROM wallet_sync_jobs
      WHERE status IN ('completed', 'failed')
        AND updated_at < NOW() - ($1::int * interval '1 day')
    `,
    jobRetentionDays,
  );

  return {
    deletedAuditRows,
    deletedCompletedJobs,
  };
}
