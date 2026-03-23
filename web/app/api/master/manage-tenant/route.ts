import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { consumeRateLimit, getClientIp } from '@/app/lib/request-rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

function parseManageTenantAction(value: unknown): 'DELETE' | 'UPDATE' | null {
  const raw = asTrimmedString(value).toUpperCase();
  if (raw === 'DELETE' || raw === 'UPDATE') return raw;
  return null;
}

function parseTenantData(value: unknown): Record<string, unknown> | null {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const clientIp = getClientIp(request);

  try {
    const rateLimit = consumeRateLimit(`master:manage-tenant:${clientIp}`, 20, 60_000);
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
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'JSON inválido',
      });
    }
    const parsedBody = parseWithSchema(body, {
      masterUsername: requiredString,
      masterPassword: requiredString,
      masterOtp: optionalString,
      action: parseManageTenantAction,
      tenantId: requiredString,
      data: parseTenantData,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, masterOtp, action, tenantId, data } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }


    if (action === 'DELETE') {
      await prisma.tenant.delete({ where: { id: tenantId } });
      return apiSuccess({ requestId, data: { success: true } });
    }

    if (action === 'UPDATE') {

      const nextCoalitionOptIn = typeof data.coalitionOptIn === 'boolean' ? data.coalitionOptIn : undefined;
      const nextCoalitionDiscount =
        data.coalitionDiscountPercent === undefined || data.coalitionDiscountPercent === null || data.coalitionDiscountPercent === ''
          ? undefined
          : Math.max(0, parseInt(String(data.coalitionDiscountPercent), 10));
      const nextCoalitionProduct = optionalString(data.coalitionProduct) || undefined;

      if (nextCoalitionOptIn === true && (nextCoalitionDiscount ?? 0) < 10) {
        return apiError({
          requestId,
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Para adherir a coalición el descuento mínimo es 10%',
        });
      }
      if (nextCoalitionOptIn === true && !nextCoalitionProduct) {
        return apiError({
          requestId,
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Para adherir a coalición debes capturar el producto participante',
        });
      }

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          name: optionalString(data.name) || undefined,
          slug: optionalString(data.slug) || undefined,
          prize: optionalString(data.prize) || undefined,
          instagram: optionalString(data.instagram) || undefined,
          isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
          coalitionOptIn: nextCoalitionOptIn,
          coalitionDiscountPercent: nextCoalitionDiscount,
          coalitionProduct: nextCoalitionProduct,
        },
      });
      return apiSuccess({ requestId, data: { success: true, tenant: updated } });
    }

    return apiError({
      requestId,
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Acción no válida',
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error inesperado',
    });
  }
}
