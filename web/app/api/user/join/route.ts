import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const userId = asTrimmedString(body.userId);
    const sessionToken = asTrimmedString(body.sessionToken);
    const tenantId = asTrimmedString(body.tenantId);

    if (!userId || !sessionToken || !tenantId) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Faltan datos' });
    }

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('user-join', request, userId),
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'TOO_MANY_REQUESTS',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const session = verifyUserSessionToken(sessionToken);
    if (session.uid !== userId) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Negocio no encontrado o inactivo' });
    }

    const membership = await prisma.membership.upsert({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
      update: {},
      create: {
        tenantId,
        userId,
        currentVisits: 0,
      },
      select: {
        id: true,
        currentVisits: true,
        tenant: {
          select: { name: true },
        },
      },
    });

    return apiSuccess({
      requestId,
      data: {
        success: true,
        membership: {
          id: membership.id,
          businessName: membership.tenant.name,
          currentVisits: membership.currentVisits,
        },
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message?: string }).message || '');
      if (message.startsWith('sessionToken')) {
        return apiError({
          requestId,
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Sesión inválida, vuelve a iniciar sesión',
        });
      }
    }

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno al procesar registro',
    });
  }
}
