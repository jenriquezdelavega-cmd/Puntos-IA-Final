import { prisma } from '@/app/lib/prisma';
import { isValidMasterPassword } from '@/app/lib/master-auth';
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

    const { masterPassword, action, tenantId, data } = parsedBody.data;

    if (!isValidMasterPassword(masterPassword)) {
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
      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          name: optionalString(data.name) || undefined,
          slug: optionalString(data.slug) || undefined,
          prize: optionalString(data.prize) || undefined,
          instagram: optionalString(data.instagram) || undefined,
          isActive: typeof data.isActive === 'boolean' ? data.isActive : undefined,
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
