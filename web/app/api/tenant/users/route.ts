import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';


function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const tenantUserId = searchParams.get('tenantUserId');
    const tenantSessionToken = searchParams.get('tenantSessionToken');

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const users = await prisma.tenantUser.findMany({ where: { tenantId: access.tenantId }, orderBy: { role: 'asc' } });
    return apiSuccess({ requestId, data: { users } });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error interno al listar usuarios',
    });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const tenantId = asTrimmedString(body.tenantId);
    const tenantUserId = asTrimmedString(body.tenantUserId);
    const tenantSessionToken = asTrimmedString(body.tenantSessionToken);
    const name = asTrimmedString(body.name);
    const username = asTrimmedString(body.username);
    const password = asTrimmedString(body.password);
    const role = asTrimmedString(body.role);
    const phone = asTrimmedString(body.phone);
    const email = asTrimmedString(body.email);

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const normalizedUsername = asTrimmedString(username);
    if (!normalizedUsername) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'username requerido',
      });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: access.tenantId } });
    if (!tenant) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Negocio inválido',
      });
    }

    const prefix = tenant.codePrefix || tenant.slug.substring(0, 4).toUpperCase();
    const fullUsername = `${prefix}.${normalizedUsername}`;

    const newUser = await prisma.tenantUser.create({
      data: {
        tenantId: access.tenantId,
        name: name || '',
        password: password || '',
        role: role || 'STAFF',
        phone: phone || '',
        email: email || '',
        username: fullUsername,
      },
    });

    return apiSuccess({ requestId, data: { success: true, user: newUser } });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'Usuario ya existe',
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

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const id = asTrimmedString(body.id);
    const tenantId = asTrimmedString(body.tenantId);
    const tenantUserId = asTrimmedString(body.tenantUserId);
    const tenantSessionToken = asTrimmedString(body.tenantSessionToken);

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const targetId = asTrimmedString(id);
    if (!targetId) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'ID requerido',
      });
    }

    const target = await prisma.tenantUser.findUnique({ where: { id: targetId }, select: { tenantId: true } });
    if (!target || target.tenantId !== access.tenantId) {
      return apiError({
        requestId,
        status: 403,
        code: 'FORBIDDEN',
        message: 'Usuario fuera de alcance',
      });
    }

    await prisma.tenantUser.delete({ where: { id: targetId } });
    return apiSuccess({ requestId, data: { success: true } });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error interno',
    });
  }
}
