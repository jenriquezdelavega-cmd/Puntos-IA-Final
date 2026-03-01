import { prisma } from '@/app/lib/prisma';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

function generatePrefix(name: string) {
  let prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  if (prefix.length < 3) {
    prefix = 'NEG';
  }

  return `${prefix}${Math.floor(10 + Math.random() * 90)}`;
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
      where: { codePrefix: null },
      select: { id: true, name: true },
    });

    const updates = tenants.map((tenant) => {
      return prisma.tenant.update({
        where: { id: tenant.id },
        data: { codePrefix: generatePrefix(tenant.name) },
      });
    });

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return apiSuccess({
      requestId,
      data: {
        updatedCount: updates.length,
        message: `Actualizados ${updates.length} negocios con prefijos.`,
      },
    });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error interno al migrar prefijos',
    });
  }
}
