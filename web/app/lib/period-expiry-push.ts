import { RewardPeriod } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { daysUntilPeriodEnds, periodKey } from '@/app/lib/reward-period';
import { addGoogleLoyaltyObjectMessage, getGoogleWalletIssuerId } from '@/app/lib/google-wallet';
import { getGoogleLoyaltyObjectId, syncGoogleLoyaltyObjectForCustomer } from '@/app/lib/google-wallet-object-sync';
import { ensureWalletRegistrationsTable } from '@/app/lib/apple-wallet-webservice';
import { deleteWalletRegistrationsByPushToken, pushWalletUpdateToDevice, shouldDeleteWalletRegistrationForPushResult } from '@/app/lib/apple-wallet-push';
import { asTrimmedString } from '@/app/lib/request-validation';

export async function maybeSendPeriodExpiryPush(params: {
  tenantId: string;
  origin: string;
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: {
      id: true,
      name: true,
      rewardPeriod: true,
      periodExpiryPushEnabled: true,
      periodExpiryPushDaysBefore: true,
      periodExpiryLastNotifiedPeriodKey: true,
      requiredVisits: true,
    },
  });

  if (!tenant || !tenant.periodExpiryPushEnabled) return;
  const period = (tenant.rewardPeriod as RewardPeriod) || 'OPEN';
  if (period === 'OPEN') return;

  const now = new Date();
  const currentPeriodKey = periodKey(period, now);
  if (tenant.periodExpiryLastNotifiedPeriodKey === currentPeriodKey) return;

  const daysRemaining = daysUntilPeriodEnds(period, now);
  if (daysRemaining == null || daysRemaining < 0) return;

  const threshold = Math.min(30, Math.max(0, Number(tenant.periodExpiryPushDaysBefore || 3)));
  if (daysRemaining > threshold) return;

  const message = daysRemaining === 0
    ? `⚠️ Hoy cierra tu periodo de recompensas en ${tenant.name}. Visítanos y redime antes del reset.`
    : `⏰ Te quedan ${daysRemaining} día(s) para redimir tu recompensa de ${tenant.name} antes del reset del periodo.`;

  try {
    await prisma.tenantWalletStyle.upsert({
      where: { tenantId: tenant.id },
      update: { lastPushMessage: message },
      create: { tenantId: tenant.id, lastPushMessage: message },
    });
  } catch (error) {
    logApiError('/lib/period-expiry-push#wallet-style', error, { tenantId: tenant.id });
  }

  const passTypeIdentifier = asTrimmedString(process.env.APPLE_PASS_TYPE_ID);
  let appleSent = 0;
  let appleFailed = 0;

  if (passTypeIdentifier) {
    try {
      await ensureWalletRegistrationsTable(prisma);
      const rows = await prisma.$queryRawUnsafe<Array<{ push_token: string }>>(
        `SELECT DISTINCT push_token FROM apple_wallet_registrations WHERE serial_number LIKE $1 AND pass_type_identifier = $2`,
        `%-${tenant.id}`,
        passTypeIdentifier,
      );
      for (const row of rows) {
        const token = asTrimmedString(row.push_token);
        if (!token) continue;
        const result = await pushWalletUpdateToDevice(token, passTypeIdentifier);
        if (result.ok) {
          appleSent += 1;
        } else {
          appleFailed += 1;
          if (shouldDeleteWalletRegistrationForPushResult(result)) {
            await deleteWalletRegistrationsByPushToken(prisma, token);
          }
        }
      }
    } catch (appleError) {
      logApiError('/lib/period-expiry-push#apple', appleError, { tenantId: tenant.id });
    }
  }

  let googleSent = 0;
  let googleFailed = 0;
  const issuerId = getGoogleWalletIssuerId();
  if (issuerId) {
    try {
      const memberships = await prisma.membership.findMany({
        where: { tenantId: tenant.id },
        select: { userId: true },
      });
      const uniqueUserIds = Array.from(new Set(memberships.map((m) => asTrimmedString(m.userId)).filter(Boolean)));
      for (let i = 0; i < uniqueUserIds.length; i += 1) {
        const userId = uniqueUserIds[i];
        try {
          const sync = await syncGoogleLoyaltyObjectForCustomer({ tenantId: tenant.id, userId, origin: params.origin });
          if (!sync.ok) {
            googleFailed += 1;
            continue;
          }
          const objectId = sync.objectId || getGoogleLoyaltyObjectId(issuerId, tenant.id, userId);
          const result = await addGoogleLoyaltyObjectMessage({
            objectId,
            header: 'Tu periodo está por cerrar',
            body: message,
            messageId: `period_expiry_${Date.now()}_${i}`,
          });
          if (result.ok) googleSent += 1;
          else googleFailed += 1;
        } catch {
          googleFailed += 1;
        }
      }
    } catch (googleError) {
      logApiError('/lib/period-expiry-push#google', googleError, { tenantId: tenant.id });
    }
  }

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        periodExpiryLastNotifiedPeriodKey: currentPeriodKey,
        periodExpiryLastNotifiedAt: now,
      },
    }),
    prisma.tenantPushLog.create({
      data: {
        tenantId: tenant.id,
        message: `[AUTO_PERIOD] ${message}`,
        devices: appleSent + googleSent,
      },
    }),
  ]);

  logApiEvent('/lib/period-expiry-push', 'period_expiry_push_sent', {
    tenantId: tenant.id,
    period: period,
    periodKey: currentPeriodKey,
    daysRemaining,
    threshold,
    appleSent,
    appleFailed,
    googleSent,
    googleFailed,
  });
}
