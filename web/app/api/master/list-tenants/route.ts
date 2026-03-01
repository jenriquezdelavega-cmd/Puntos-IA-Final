import { prisma } from '@/app/lib/prisma';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

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
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    if (!isValidMasterPassword(parsedBody.data.masterPassword)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const tenants = await prisma.tenant.findMany({
      include: { users: true },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess({ requestId, data: { tenants } });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error interno al listar negocios',
    });
  }
}
