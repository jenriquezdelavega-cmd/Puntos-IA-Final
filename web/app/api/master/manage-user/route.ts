import { prisma } from '@/app/lib/prisma';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { hashPassword, isHashedPassword } from '@/app/lib/password';
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
      masterPassword: requiredString,
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

    const { masterPassword, action, userId, data } = parsedBody.data;

    if (!isValidMasterPassword(masterPassword)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }


    if (action === 'DELETE') {
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

      const updated = await prisma.tenantUser.update({
        where: { id: userId },
        data: {
          name: optionalString(data.name) || undefined,
          username: optionalString(data.username) || undefined,
          password: nextPassword,
          role: optionalString(data.role) || undefined,
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
