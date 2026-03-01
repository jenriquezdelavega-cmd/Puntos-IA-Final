import { prisma } from '@/app/lib/prisma';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { pushWalletUpdateToDevice, deleteWalletRegistrationsByPushToken } from '@/app/lib/apple-wallet-push';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

const MAX_PUSHES_PER_WEEK = 2;

function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
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
    if (!passTypeIdentifier) {
      return apiError({
        requestId,
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'APPLE_PASS_TYPE_ID no configurado',
      });
    }

    const weekStart = startOfWeek();
    const pushesThisWeek = await prisma.tenantPushLog.count({
      where: { tenantId: access.tenantId, sentAt: { gte: weekStart } },
    });

    if (pushesThisWeek >= MAX_PUSHES_PER_WEEK) {
      return apiError({
        requestId,
        status: 429,
        code: 'FORBIDDEN',
        message: `Ya enviaste ${MAX_PUSHES_PER_WEEK} notificaciones esta semana. Podrás enviar más el próximo lunes.`,
        details: { remaining: 0 },
      });
    }

    await prisma.tenantWalletStyle.upsert({
      where: { tenantId: access.tenantId },
      update: { lastPushMessage: trimmedMessage },
      create: { tenantId: access.tenantId, lastPushMessage: trimmedMessage },
    });

    const registrations = await prisma.$queryRawUnsafe<Array<{ push_token: string; serial_number: string }>>(
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

    let sent = 0;
    let failed = 0;

    const seenTokens = new Set<string>();
    for (const reg of registrations) {
      const token = asTrimmedString(reg.push_token);
      if (!token || seenTokens.has(token)) continue;
      seenTokens.add(token);

      try {
        const result = await pushWalletUpdateToDevice(token, passTypeIdentifier);
        if (result.ok) {
          sent++;
        } else {
          failed++;
          if (result.status === 410 || result.status === 400) {
            await deleteWalletRegistrationsByPushToken(prisma, token);
          }
        }
      } catch {
        failed++;
      }
    }

    await prisma.tenantPushLog.create({
      data: { tenantId: access.tenantId, message: trimmedMessage, devices: sent },
    });

    const remaining = MAX_PUSHES_PER_WEEK - pushesThisWeek - 1;

    logApiEvent('/api/admin/push', 'push_broadcast', {
      tenantId: access.tenantId,
      message: trimmedMessage,
      totalRegistrations: registrations.length,
      sent,
      failed,
      remaining,
    });

    return apiSuccess({
      requestId,
      data: {
        success: true,
        sent,
        failed,
        remaining,
        message: `Notificación enviada a ${sent} dispositivo${sent === 1 ? '' : 's'}`,
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

    const weekStart = startOfWeek();
    const pushesThisWeek = await prisma.tenantPushLog.count({
      where: { tenantId: access.tenantId, sentAt: { gte: weekStart } },
    });

    const recentPushes = await prisma.tenantPushLog.findMany({
      where: { tenantId: access.tenantId },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });

    return apiSuccess({
      requestId,
      data: {
        remaining: MAX_PUSHES_PER_WEEK - pushesThisWeek,
        maxPerWeek: MAX_PUSHES_PER_WEEK,
        recent: recentPushes,
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
