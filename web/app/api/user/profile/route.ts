import { prisma } from '@/app/lib/prisma';
import { verifyPassword } from '@/app/lib/password';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, isStrongEnoughPassword, isValidPhone, parseJsonObject } from '@/app/lib/request-validation';

type UserProfileBody = {
  phone?: string;
  password?: string;
};

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const normalizedPhone = asTrimmedString(body.phone);
    const normalizedPassword = asTrimmedString(body.password);

    if (!normalizedPhone || !normalizedPassword) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Faltan credenciales',
      });
    }

    if (!isValidPhone(normalizedPhone)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Formato de teléfono inválido',
      });
    }

    if (!isStrongEnoughPassword(normalizedPassword)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Contraseña inválida',
      });
    }

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        memberships: {
          include: {
            tenant: true,
            visits: {
              take: 5,
              orderBy: { visitedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado',
      });
    }

    if (!verifyPassword(normalizedPassword, user.password)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Contraseña incorrecta',
      });
    }

    const profileData = {
      name: user.name,
      phone: user.phone,
      joinedAt: user.createdAt,
      memberships: user.memberships.map((membership) => ({
        businessName: membership.tenant.name,
        currentPoints: membership.currentVisits,
        totalLifetimeVisits: membership.totalVisits,
        history: membership.visits,
      })),
    };

    return apiSuccess({ requestId, data: { success: true, data: profileData } });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error del servidor',
    });
  }
}
