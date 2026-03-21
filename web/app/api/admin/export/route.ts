import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { isMissingTableOrColumnError } from '@/app/lib/prisma-error-helpers';

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
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
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

    const memberships = await prisma.membership.findMany({
      where: { tenantId: access.tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            birthDate: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastVisitAt: 'desc' },
    });

    const visitsWithAmount = async () =>
      prisma.visit.findMany({
        where: { tenantId: access.tenantId },
        select: {
          id: true,
          membershipId: true,
          tenantId: true,
          dailyCodeId: true,
          visitDay: true,
          visitedAt: true,
          purchaseAmount: true,
          ticketNumber: true,
        },
        orderBy: { visitedAt: 'desc' },
      });

    const visitsWithoutAmount = async () =>
      prisma.visit.findMany({
        where: { tenantId: access.tenantId },
        select: {
          id: true,
          membershipId: true,
          tenantId: true,
          dailyCodeId: true,
          visitDay: true,
          visitedAt: true,
        },
        orderBy: { visitedAt: 'desc' },
      });

    let visits: Array<Record<string, unknown>> = [];
    try {
      const rows = await visitsWithAmount();
      visits = rows.map((visit) => ({
        ...visit,
        visitedAt: visit.visitedAt.toISOString(),
        purchaseAmount: Number(visit.purchaseAmount || 0),
        ticketNumber: String(visit.ticketNumber || ''),
      }));
    } catch (error: unknown) {
      if (!isMissingTableOrColumnError(error)) throw error;
      const rows = await visitsWithoutAmount();
      visits = rows.map((visit) => ({
        ...visit,
        visitedAt: visit.visitedAt.toISOString(),
        purchaseAmount: 0,
        ticketNumber: '',
      }));
    }

    const customers = memberships.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name || 'Anónimo',
      phone: membership.user.phone || '',
      email: membership.user.email || '',
      gender: membership.user.gender || '',
      birthDate: membership.user.birthDate ? membership.user.birthDate.toISOString() : null,
      customerSince: membership.user.createdAt.toISOString(),
    }));

    const membershipRows = memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      totalVisits: membership.totalVisits,
      currentVisits: membership.currentVisits,
      periodType: membership.periodType,
      periodKey: membership.periodKey,
      lastVisitAt: membership.lastVisitAt ? membership.lastVisitAt.toISOString() : null,
      customerSince: membership.user.createdAt.toISOString(),
    }));

    return apiSuccess({
      requestId,
      data: {
        generatedAt: new Date().toISOString(),
        tenantId: access.tenantId,
        tables: {
          customers,
          memberships: membershipRows,
          visits,
        },
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error al exportar base',
    });
  }
}
