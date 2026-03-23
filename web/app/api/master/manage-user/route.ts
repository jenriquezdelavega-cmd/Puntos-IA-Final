import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { hashPassword, isHashedPassword } from '@/app/lib/password';
import { consumeRateLimit, getClientIp } from '@/app/lib/request-rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

function parseManageUserAction(value: unknown): 'DELETE' | 'UPDATE' | null {
  const raw = asTrimmedString(value).toUpperCase();
  if (raw === 'DELETE' || raw === 'UPDATE') return raw;
  return null;
}

function parseUserData(value: unknown): Record<string, unknown> | null {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const clientIp = getClientIp(request);

  try {
    const rateLimit = consumeRateLimit(`master:manage-user:${clientIp}`, 30, 60_000);
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
      action: parseManageUserAction,
      userId: requiredString,
      data: parseUserData,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, masterOtp, action, userId, data } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }


    if (action === 'DELETE') {
      const existing = await prisma.tenantUser.findUnique({
        where: { id: userId },
        select: { tenantId: true, role: true },
      });
      if (!existing) {
        return apiError({
          requestId,
          status: 404,
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }
      if (String(existing.role || '').toUpperCase() === 'ADMIN') {
        const adminCount = await prisma.tenantUser.count({ where: { tenantId: existing.tenantId, role: 'ADMIN' } });
        if (adminCount <= 1) {
          return apiError({
            requestId,
            status: 400,
            code: 'BAD_REQUEST',
            message: 'No se puede eliminar el único administrador del negocio',
          });
        }
      }
      await prisma.tenantUser.delete({ where: { id: userId } });
      return apiSuccess({ requestId, data: { success: true } });
    }

    if (action === 'UPDATE') {
      const nextPasswordRaw = optionalString(data.password);
      const nextPassword = !nextPasswordRaw
        ? undefined
        : isHashedPassword(nextPasswordRaw)
          ? nextPasswordRaw
          : hashPassword(nextPasswordRaw);

      const existing = await prisma.tenantUser.findUnique({
        where: { id: userId },
        select: { tenantId: true, role: true },
      });
      if (!existing) {
        return apiError({
          requestId,
          status: 404,
          code: 'NOT_FOUND',
          message: 'Usuario no encontrado',
        });
      }

      const normalizedRole = optionalString(data.role)?.toUpperCase();
      if (normalizedRole && normalizedRole !== 'ADMIN' && normalizedRole !== 'STAFF') {
        return apiError({
          requestId,
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Rol inválido',
        });
      }
      if (normalizedRole === 'ADMIN') {
        const otherAdmin = await prisma.tenantUser.findFirst({
          where: { tenantId: existing.tenantId, role: 'ADMIN', id: { not: userId } },
          select: { id: true },
        });
        if (otherAdmin) {
          return apiError({
            requestId,
            status: 409,
            code: 'CONFLICT',
            message: 'Este negocio ya tiene un administrador asignado',
          });
        }
      }
      if (normalizedRole === 'STAFF' && String(existing.role || '').toUpperCase() === 'ADMIN') {
        const adminCount = await prisma.tenantUser.count({ where: { tenantId: existing.tenantId, role: 'ADMIN' } });
        if (adminCount <= 1) {
          return apiError({
            requestId,
            status: 400,
            code: 'BAD_REQUEST',
            message: 'No se puede degradar al único administrador del negocio',
          });
        }
      }

      const updated = await prisma.tenantUser.update({
        where: { id: userId },
        data: {
          name: optionalString(data.name) || undefined,
          username: optionalString(data.username) || undefined,
          password: nextPassword,
          role: normalizedRole || undefined,
          phone: optionalString(data.phone) || undefined,
          email: optionalString(data.email) || undefined,
        },
      });

      return apiSuccess({ requestId, data: { success: true, user: updated } });
    }

    return apiError({
      requestId,
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Acción no válida',
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'Usuario duplicado',
      });
    }

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error inesperado',
    });
  }
}
