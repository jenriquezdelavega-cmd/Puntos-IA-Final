import { PrismaClient } from '@prisma/client';
import { asTrimmedString } from '@/app/lib/request-validation';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { ensureWalletRegistrationsTable, touchWalletPassRegistrations } from '@/app/lib/apple-wallet-webservice';
import {
  deleteWalletRegistrationsByPushToken,
  pushWalletUpdateToDevice,
  shouldDeleteWalletRegistrationForPushResult,
} from '@/app/lib/apple-wallet-push';
import { syncGoogleLoyaltyObjectsForTenant } from '@/app/lib/google-wallet-object-sync';
import {
  appendWalletSyncAuditLog,
  enqueueWalletSyncJob,
  readWalletSyncRuntimeConfig,
  type WalletSyncReason,
} from '@/app/lib/wallet-sync-config';

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  const safeConcurrency = Math.max(1, Math.min(concurrency, 20));
  let index = 0;

  async function consume() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      await worker(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(safeConcurrency, items.length || 1) }, () => consume()));
}

export async function refreshWalletsForTenant(params: {
  prisma: PrismaClient;
  tenantId: string;
  origin: string;
  reason: WalletSyncReason;
}) {
  const config = await readWalletSyncRuntimeConfig(params.prisma);
  const passTypeIdentifier = asTrimmedString(process.env.APPLE_PASS_TYPE_ID);

  if (config.appleEnabled && passTypeIdentifier) {
    try {
      await ensureWalletRegistrationsTable(params.prisma);

      const regs = await params.prisma.$queryRawUnsafe<Array<{ push_token: string; serial_number: string }>>(
        `SELECT DISTINCT push_token, serial_number FROM apple_wallet_registrations WHERE serial_number LIKE $1 AND pass_type_identifier = $2`,
        `%-${params.tenantId}`,
        passTypeIdentifier,
      );

      // Ensure passd can discover updates for all active serials.
      await runWithConcurrency(regs, config.appleTouchConcurrency, async (reg) => {
        await touchWalletPassRegistrations(params.prisma, {
          serialNumber: reg.serial_number,
          passTypeIdentifier,
        });
      });

      // Push update notifications, deduplicating by APNS token.
      const pushTokens = Array.from(
        new Set(
          regs
            .map((reg) => asTrimmedString(reg.push_token))
            .filter(Boolean),
        ),
      );

      await runWithConcurrency(pushTokens, config.applePushConcurrency, async (token) => {
        const result = await pushWalletUpdateToDevice(token, passTypeIdentifier);
        if (!result.ok && shouldDeleteWalletRegistrationForPushResult(result)) {
          await deleteWalletRegistrationsByPushToken(params.prisma, token);
        }
      });

      logApiEvent('/api/wallet-sync', 'apple_refresh_complete', {
        tenantId: params.tenantId,
        reason: params.reason,
        devices: pushTokens.length,
        serials: regs.length,
      });

      await appendWalletSyncAuditLog({
        prisma: params.prisma,
        tenantId: params.tenantId,
        reason: params.reason,
        channel: 'apple',
        status: 'success',
        metadata: {
          serials: regs.length,
          devices: pushTokens.length,
          touchConcurrency: config.appleTouchConcurrency,
          pushConcurrency: config.applePushConcurrency,
        },
      });
    } catch (appleError) {
      logApiError('/api/wallet-sync#apple', appleError);
      await appendWalletSyncAuditLog({
        prisma: params.prisma,
        tenantId: params.tenantId,
        reason: params.reason,
        channel: 'apple',
        status: 'error',
        message: appleError instanceof Error ? appleError.message : String(appleError),
      });
    }
  } else if (!config.appleEnabled) {
    await appendWalletSyncAuditLog({
      prisma: params.prisma,
      tenantId: params.tenantId,
      reason: params.reason,
      channel: 'apple',
      status: 'skipped',
      message: 'Apple sync disabled by runtime config',
    });
  } else {
    await appendWalletSyncAuditLog({
      prisma: params.prisma,
      tenantId: params.tenantId,
      reason: params.reason,
      channel: 'apple',
      status: 'skipped',
      message: 'APPLE_PASS_TYPE_ID not configured',
    });
  }

  if (config.googleEnabled) {
    try {
      const googleSync = await syncGoogleLoyaltyObjectsForTenant({
        tenantId: params.tenantId,
        origin: params.origin,
        maxCustomers: config.googleSyncMaxCustomers,
      });

      logApiEvent('/api/wallet-sync', 'google_refresh_complete', {
        tenantId: params.tenantId,
        reason: params.reason,
        total: googleSync.total,
        synced: googleSync.synced,
      });

      await appendWalletSyncAuditLog({
        prisma: params.prisma,
        tenantId: params.tenantId,
        reason: params.reason,
        channel: 'google',
        status: 'success',
        metadata: {
          total: googleSync.total,
          synced: googleSync.synced,
          maxCustomers: config.googleSyncMaxCustomers,
        },
      });
    } catch (googleError) {
      logApiError('/api/wallet-sync#google', googleError);
      await appendWalletSyncAuditLog({
        prisma: params.prisma,
        tenantId: params.tenantId,
        reason: params.reason,
        channel: 'google',
        status: 'error',
        message: googleError instanceof Error ? googleError.message : String(googleError),
      });
    }
  } else {
    await appendWalletSyncAuditLog({
      prisma: params.prisma,
      tenantId: params.tenantId,
      reason: params.reason,
      channel: 'google',
      status: 'skipped',
      message: 'Google sync disabled by runtime config',
    });
  }
}

export async function requestWalletRefreshForTenant(params: {
  prisma: PrismaClient;
  tenantId: string;
  origin: string;
  reason: WalletSyncReason;
}) {
  const config = await readWalletSyncRuntimeConfig(params.prisma);
  if (config.executionMode === 'immediate') {
    await refreshWalletsForTenant(params);
    return { mode: 'immediate' as const };
  }

  const jobId = await enqueueWalletSyncJob({
    prisma: params.prisma,
    tenantId: params.tenantId,
    reason: params.reason,
    origin: params.origin,
    maxAttempts: config.workerMaxAttempts,
  });

  await appendWalletSyncAuditLog({
    prisma: params.prisma,
    tenantId: params.tenantId,
    reason: params.reason,
    channel: 'apple',
    status: 'skipped',
    message: `Wallet sync encolado (job ${jobId}) por modo queued`,
  });

  return { mode: 'queued' as const, jobId };
}
