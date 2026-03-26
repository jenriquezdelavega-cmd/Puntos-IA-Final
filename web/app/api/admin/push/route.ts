import { prisma } from '@/app/lib/prisma';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import {
  deleteWalletRegistrationsByPushToken,
  pushWalletUpdateToDevice,
  shouldDeleteWalletRegistrationForPushResult,
} from '@/app/lib/apple-wallet-push';
import { ensureWalletRegistrationsTable } from '@/app/lib/apple-wallet-webservice';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { addGoogleLoyaltyObjectMessage, getGoogleWalletIssuerId } from '@/app/lib/google-wallet';
import { getGoogleLoyaltyObjectId, syncGoogleLoyaltyObjectForCustomer } from '@/app/lib/google-wallet-object-sync';
import { isMissingTableOrColumnError } from '@/app/lib/prisma-error-helpers';

const MAX_PUSHES_PER_DAY = 1;
const APPLE_PUSH_BATCH_SIZE = 20;
const GOOGLE_PUSH_BATCH_SIZE = 8;

async function ensureTenantPushLogTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS tenant_push_logs (
      id TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL,
      message TEXT NOT NULL,
      devices INTEGER NOT NULL DEFAULT 0,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_tenant_push_logs_tenant_sent_at
    ON tenant_push_logs ("tenantId", sent_at DESC)
  `);
}

async function ensureTenantWalletStyleTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS tenant_wallet_styles (
      tenant_id TEXT PRIMARY KEY,
      background_color TEXT NOT NULL DEFAULT 'rgb(31,41,55)',
      foreground_color TEXT NOT NULL DEFAULT 'rgb(255,255,255)',
      label_color TEXT NOT NULL DEFAULT 'rgb(191,219,254)',
      strip_image_data TEXT NOT NULL DEFAULT '',
      last_push_message TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

function startOfDay() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

async function processInBatches<T>(
  items: T[],
  batchSize: number,
  handler: (item: T, index: number) => Promise<void>,
) {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    await Promise.all(batch.map((item, batchIndex) => handler(item, index + batchIndex)));
  }
}


export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'JSON inválido',
      });
    }
    const parsedBody = parseWithSchema(body, {
      tenantId: requiredString,
      tenantUserId: requiredString,
      tenantSessionToken: requiredString,
      message: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { tenantId, tenantUserId, tenantSessionToken, message } = parsedBody.data;

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('admin-push', request, `${tenantId}:${tenantUserId}`),
      limit: 6,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'FORBIDDEN',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        details: { remaining: 0 },
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const trimmedMessage = asTrimmedString(message);

    if (!trimmedMessage) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Escribe un mensaje para la notificación',
      });
    }

    if (trimmedMessage.length > 200) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'El mensaje no puede tener más de 200 caracteres',
      });
    }

    const passTypeIdentifier = asTrimmedString(process.env.APPLE_PASS_TYPE_ID);

    const dayStart = startOfDay();
    await ensureTenantPushLogTable();
    const pushesToday = await prisma.tenantPushLog.count({
      where: { tenantId: access.tenantId, sentAt: { gte: dayStart } },
    });

    if (pushesToday >= MAX_PUSHES_PER_DAY) {
      return apiError({
        requestId,
        status: 429,
        code: 'FORBIDDEN',
        message: `Ya enviaste 1 notificación el día de hoy. Podrás enviar más el día de mañana.`,
        details: { remaining: 0 },
      });
    }

    await ensureTenantWalletStyleTable();
    try {
      await prisma.tenantWalletStyle.upsert({
        where: { tenantId: access.tenantId },
        update: { lastPushMessage: trimmedMessage },
        create: { tenantId: access.tenantId, lastPushMessage: trimmedMessage },
      });
    } catch (error: unknown) {
      if (!isMissingTableOrColumnError(error)) throw error;
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO tenant_wallet_styles (tenant_id, last_push_message, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (tenant_id)
          DO UPDATE SET
            last_push_message = EXCLUDED.last_push_message,
            updated_at = NOW()
        `,
        access.tenantId,
        trimmedMessage,
      );
    }

    let sent = 0;
    let failed = 0;
    let appleTargetedDevices = 0;
    const appleFailureReasons: Record<string, number> = {};
    let registrations: Array<{ push_token: string; serial_number: string }> = [];
    if (passTypeIdentifier) {
      await ensureWalletRegistrationsTable(prisma);
      registrations = await prisma.$queryRawUnsafe<Array<{ push_token: string; serial_number: string }>>(
        `SELECT DISTINCT push_token, serial_number
         FROM apple_wallet_registrations
         WHERE serial_number LIKE $1
           AND pass_type_identifier = $2`,
        `%-${access.tenantId}`,
        passTypeIdentifier,
      );

      await prisma.$executeRawUnsafe(
        `UPDATE apple_wallet_registrations SET updated_at = NOW()
         WHERE serial_number LIKE $1 AND pass_type_identifier = $2`,
        `%-${access.tenantId}`,
        passTypeIdentifier,
      );

      const seenTokens = new Set<string>();
      for (const reg of registrations) {
        const token = asTrimmedString(reg.push_token);
        if (!token || seenTokens.has(token)) continue;
        seenTokens.add(token);
      }

      const uniqueTokens = Array.from(seenTokens);
      appleTargetedDevices = uniqueTokens.length;
      await processInBatches(uniqueTokens, APPLE_PUSH_BATCH_SIZE, async (token) => {
        try {
          const result = await pushWalletUpdateToDevice(token, passTypeIdentifier);
          if (result.ok) {
            sent++;
          } else {
            failed++;
            const key = `${result.status}:${result.reason || 'unknown'}`;
            appleFailureReasons[key] = (appleFailureReasons[key] || 0) + 1;
            if (shouldDeleteWalletRegistrationForPushResult(result)) {
              await deleteWalletRegistrationsByPushToken(prisma, token);
            }
          }
        } catch {
          failed++;
          const key = '0:unexpected_error';
          appleFailureReasons[key] = (appleFailureReasons[key] || 0) + 1;
        }
      });
    } else {
      appleFailureReasons.apple_wallet_not_configured = 1;
    }

    const tenantInfo = await prisma.tenant.findUnique({
      where: { id: access.tenantId },
      select: { name: true },
    });
    const tenantName = asTrimmedString(tenantInfo?.name) || 'tu negocio';

    let googleSent = 0;
    let googleFailed = 0;
    const googleFailureReasons: Record<string, number> = {};
    const googleIssuerId = getGoogleWalletIssuerId();
    const origin = new URL(request.url).origin;

    if (googleIssuerId) {
      const memberships = await prisma.membership.findMany({
        where: { tenantId: access.tenantId },
        select: { userId: true },
      });

      const uniqueUserIds = Array.from(new Set(memberships.map((item) => asTrimmedString(item.userId)).filter(Boolean)));
      await processInBatches(uniqueUserIds, GOOGLE_PUSH_BATCH_SIZE, async (userId, index) => {
        try {
          const syncResult = await syncGoogleLoyaltyObjectForCustomer({
            tenantId: access.tenantId,
            userId,
            origin,
          });
          if (!syncResult.ok) {
            const reason = `sync_${syncResult.reason || 'failed'}`;
            googleFailed += 1;
            googleFailureReasons[reason] = (googleFailureReasons[reason] || 0) + 1;
            return;
          }

          const objectId = syncResult.objectId || getGoogleLoyaltyObjectId(googleIssuerId, access.tenantId, userId);
          const pushResult = await addGoogleLoyaltyObjectMessage({
            objectId,
            header: `Novedad de ${tenantName}`,
            body: trimmedMessage,
            messageId: `push_${Date.now()}_${index}`,
          });
          if (!pushResult.ok) {
            const reason = `message_${pushResult.status}`;
            googleFailed += 1;
            googleFailureReasons[reason] = (googleFailureReasons[reason] || 0) + 1;
            return;
          }

          googleSent += 1;
        } catch {
          googleFailed += 1;
          const reason = 'unexpected_error';
          googleFailureReasons[reason] = (googleFailureReasons[reason] || 0) + 1;
        }
      });
    } else {
      googleFailureReasons.google_wallet_not_configured = 1;
    }

    await prisma.tenantPushLog.create({
      data: { tenantId: access.tenantId, message: trimmedMessage, devices: sent },
    });

    const remaining = MAX_PUSHES_PER_DAY - pushesToday - 1;
    const totalDelivered = sent + googleSent;
    const deliveryState = totalDelivered > 0 ? 'delivered' : 'no_delivery';

    logApiEvent('/api/admin/push', 'push_broadcast', {
      tenantId: access.tenantId,
      message: trimmedMessage,
      totalRegistrations: registrations.length,
      appleTargetedDevices,
      appleSent: sent,
      appleFailed: failed,
      appleFailureReasons,
      googleSent,
      googleFailed,
      googleFailureReasons,
      remaining,
      deliveryState,
    });

    return apiSuccess({
      requestId,
      data: {
        success: totalDelivered > 0,
        deliveryState,
        sent,
        failed,
        apple: {
          sent,
          failed,
          reasons: appleFailureReasons,
          totalRegistrations: registrations.length,
          targetedDevices: appleTargetedDevices,
        },
        google: {
          sent: googleSent,
          failed: googleFailed,
          reasons: googleFailureReasons,
        },
        remaining,
        message:
          totalDelivered > 0
            ? `Notificación enviada. Apple: ${sent} dispositivo${sent === 1 ? '' : 's'} · Google: ${googleSent} pase${googleSent === 1 ? '' : 's'}`
            : 'Se procesó el envío, pero no se entregó a ningún dispositivo/pase. Revisa la cobertura y razones de fallo.',
      },
    });
  } catch (error: unknown) {
    logApiError('/api/admin/push', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error enviando notificación',
    });
  }
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const tenantUserId = searchParams.get('tenantUserId');
    const tenantSessionToken = searchParams.get('tenantSessionToken');

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('admin-push', request, `${tenantId}:${tenantUserId}`),
      limit: 6,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'FORBIDDEN',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        details: { remaining: 0 },
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const dayStart = startOfDay();
    await ensureTenantPushLogTable();
    const pushesToday = await prisma.tenantPushLog.count({
      where: { tenantId: access.tenantId, sentAt: { gte: dayStart } },
    });

    const recentPushes = await prisma.tenantPushLog.findMany({
      where: { tenantId: access.tenantId },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });

    const passTypeIdentifier = asTrimmedString(process.env.APPLE_PASS_TYPE_ID);
    let appleRegisteredDevices = 0;
    if (passTypeIdentifier) {
      await ensureWalletRegistrationsTable(prisma);
      const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(DISTINCT push_token)::int AS count
         FROM apple_wallet_registrations
         WHERE serial_number LIKE $1
           AND pass_type_identifier = $2`,
        `%-${access.tenantId}`,
        passTypeIdentifier,
      );
      appleRegisteredDevices = Number(rows[0]?.count || 0);
    }
    const customerMemberships = await prisma.membership.count({
      where: { tenantId: access.tenantId },
    });

    return apiSuccess({
      requestId,
      data: {
        remaining: MAX_PUSHES_PER_DAY - pushesToday,
        maxPerDay: MAX_PUSHES_PER_DAY,
        recent: recentPushes,
        coverage: {
          appleRegisteredDevices,
          customerMemberships,
          appleConfigured: Boolean(passTypeIdentifier),
          googleConfigured: Boolean(getGoogleWalletIssuerId()),
        },
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error',
    });
  }
}
