import { apiError, apiSuccess, getRequestId, type ApiErrorCode } from '@/app/lib/api-response';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const parsedBody = parseWithSchema(body, {
      tenantId: requiredString,
      tenantUserId: requiredString,
      tenantSessionToken: requiredString,
      code: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: `Campo inválido: ${String(parsedBody.field)}` });
    }

    const { tenantId, tenantUserId, tenantSessionToken, code } = parsedBody.data;

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('redeem-validate', request, `${tenantId}:${tenantUserId}`),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'BAD_REQUEST',
        message: `Demasiadas validaciones. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN', 'STAFF'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }


    const redemption = await prisma.redemption.findFirst({
      where: { tenantId: access.tenantId, code, isUsed: false },
      include: { user: true },
    });

    if (!redemption) {
      logApiEvent('/api/redeem/validate', 'invalid_or_used_code', { tenantId: access.tenantId, code });
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Código inválido o ya fue canjeado',
      });
    }

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { isUsed: true },
    });

    logApiEvent('/api/redeem/validate', 'redemption_validated', {
      tenantId: access.tenantId,
      code,
      redemptionId: redemption.id,
    });

    return apiSuccess({
      requestId,
      data: {
        ok: true,
        user: redemption.user?.name || redemption.user?.phone || 'Usuario',
        redemption: {
          id: redemption.id,
          code: redemption.code,
          tenantId: redemption.tenantId,
          isUsed: true,
          usedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error: unknown) {
    logApiError('/api/redeem/validate', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error inesperado',
    });
  }
}
