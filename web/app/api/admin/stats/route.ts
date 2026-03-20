import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
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
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'JSON inválido',
      });
    }
    const parsedBody = parseWithSchema(body, {
      tenantId: requiredString,
      tenantUserId: requiredString,
      tenantSessionToken: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { tenantId, tenantUserId, tenantSessionToken } = parsedBody.data;
    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const groupedUsers = await prisma.user.groupBy({
      by: ['gender'],
      where: {
        memberships: {
          some: {
            tenantId: access.tenantId,
          },
        },
      },
      _count: {
        gender: true,
      },
    });

    const totalMembershipsPromise = prisma.membership.count({
      where: { tenantId: access.tenantId },
    });

    const stats: Record<string, number> = { Hombre: 0, Mujer: 0 };

    groupedUsers.forEach((group) => {
      const gender = (group.gender || '').toLowerCase();
      const count = Number(group._count.gender ?? 0);
      if (['hombre', 'male', 'm'].includes(gender)) {
        stats.Hombre += count;
      } else if (['mujer', 'female', 'f'].includes(gender)) {
        stats.Mujer += count;
      }
    });

    const total = await totalMembershipsPromise;

    return apiSuccess({
      requestId,
      data: {
        total,
        breakdown: [
          { gender: 'Hombre', _count: { gender: stats.Hombre } },
          { gender: 'Mujer', _count: { gender: stats.Mujer } },
        ],
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno en estadísticas',
    });
  }
}
