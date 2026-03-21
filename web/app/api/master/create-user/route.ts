import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { hashPassword } from '@/app/lib/password';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

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
      tenantId: requiredString,
      username: requiredString,
      password: requiredString,
      name: optionalString,
      phone: optionalString,
      email: optionalString,
      role: optionalString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, masterOtp, tenantId, name, phone, email, username, password, role } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }


    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Negocio no existe',
      });
    }

    const prefix = tenant.codePrefix || tenant.slug.substring(0, 4).toUpperCase();
    const fullUsername = `${prefix}.${username}`;
    const normalizedRole = asTrimmedString(role || 'STAFF').toUpperCase();

    if (normalizedRole !== 'ADMIN' && normalizedRole !== 'STAFF') {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Rol inválido',
      });
    }
    if (normalizedRole === 'ADMIN') {
      const existingAdmin = await prisma.tenantUser.findFirst({
        where: { tenantId, role: 'ADMIN' },
        select: { id: true },
      });
      if (existingAdmin) {
        return apiError({
          requestId,
          status: 409,
          code: 'CONFLICT',
          message: 'Este negocio ya tiene un administrador asignado',
        });
      }
    }

    const newUser = await prisma.tenantUser.create({
      data: {
        name: name || '',
        phone: phone || '',
        email: email || '',
        password: hashPassword(password),
        role: normalizedRole,
        username: fullUsername,
        tenant: { connect: { id: tenantId } },
      },
    });

    return apiSuccess({ requestId, data: { success: true, user: newUser } });
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
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
