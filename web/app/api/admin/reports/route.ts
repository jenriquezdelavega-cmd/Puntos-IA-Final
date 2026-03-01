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

    const visits = await prisma.visit.findMany({
      where: { membership: { tenantId: access.tenantId } },
      orderBy: { visitedAt: 'asc' },
    });

    const visitsByDate: Record<string, number> = {};
    visits.forEach((visit) => {
      const date = visit.visitedAt.toISOString().split('T')[0];
      visitsByDate[date] = (visitsByDate[date] || 0) + 1;
    });

    const chartData = Object.keys(visitsByDate).map((date) => ({ date, count: visitsByDate[date] }));

    const memberships = await prisma.membership.findMany({
      where: { tenantId: access.tenantId },
      include: { user: true },
    });

    let male = 0;
    let female = 0;
    let other = 0;

    const ages = { '<18': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-65': 0, '>65': 0 };

    memberships.forEach((membership) => {
      const gender = (membership.user.gender || '').toLowerCase();
      if (gender === 'hombre' || gender === 'm') male++;
      else if (gender === 'mujer' || gender === 'f') female++;
      else other++;

      if (membership.user.birthDate) {
        const birth = new Date(membership.user.birthDate);
        const age = new Date().getFullYear() - birth.getFullYear();

        if (age < 18) ages['<18']++;
        else if (age <= 25) ages['18-25']++;
        else if (age <= 35) ages['26-35']++;
        else if (age <= 45) ages['36-45']++;
        else if (age <= 65) ages['46-65']++;
        else ages['>65']++;
      }
    });

    const genderData = [
      { label: 'Hombres', value: male, color: '#3b82f6' },
      { label: 'Mujeres', value: female, color: '#ec4899' },
      { label: 'Otros', value: other, color: '#9ca3af' },
    ];

    const ageData = Object.keys(ages).map((key) => ({ label: key, value: ages[key as keyof typeof ages] }));

    const csvData = memberships.map((membership) => ({
      Nombre: membership.user.name || 'Anónimo',
      Telefono: membership.user.phone,
      Email: membership.user.email || '',
      Genero: membership.user.gender || '',
      Visitas: membership.totalVisits,
      Ultima: membership.lastVisitAt ? membership.lastVisitAt.toISOString().split('T')[0] : '-',
    }));

    return apiSuccess({ requestId, data: { chartData, genderData, ageData, csvData } });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno al generar reportes',
    });
  }
}
