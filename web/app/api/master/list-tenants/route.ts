import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const raw = asTrimmedString(value).toLowerCase();
  if (!raw) return undefined;
  if (['1', 'true', 'yes', 'si', 'sí'].includes(raw)) return true;
  if (['0', 'false', 'no'].includes(raw)) return false;
  return undefined;
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
      masterUsername: requiredString,
      masterPassword: requiredString,
      masterOtp: optionalString,
      coalitionOnly: parseOptionalBoolean,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    if (!isValidMasterCredentials(parsedBody.data.masterUsername, parsedBody.data.masterPassword, parsedBody.data.masterOtp)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const coalitionOnly = parsedBody.data.coalitionOnly === true;

    const tenants = await prisma.tenant.findMany({
      where: coalitionOnly
        ? {
            coalitionOptIn: true,
            coalitionDiscountPercent: { gte: 10 },
            coalitionProduct: { not: '' },
          }
        : undefined,
      include: { users: true },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess({ requestId, data: { tenants, coalitionOnly } });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error interno al listar negocios',
    });
  }
}
