import { prisma } from '@/app/lib/prisma';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';
import { generateUserSessionToken } from '@/app/lib/user-session-token';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, isValidPhone, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';


export async function POST(req: Request) {
  const requestId = getRequestId(req);

  try {
    const body = await parseJsonObject(req);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const parsedBody = parseWithSchema(body, {
      phone: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const normalizedPhone = parsedBody.data.phone;
    if (!isValidPhone(normalizedPhone)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Formato de teléfono inválido',
      });
    }

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('user-login', req, normalizedPhone),
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'FORBIDDEN',
        message: `Demasiados intentos. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Usuario no existe',
      });
    }

    if (typeof user.password === 'string' && user.password.length > 0) {
      const inputPassword = String(body.password ?? '');
      if (!inputPassword) {
        return apiError({
          requestId,
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Contraseña requerida',
        });
      }

      const validPassword = verifyPassword(inputPassword, user.password);

      if (!validPassword) {
        return apiError({
          requestId,
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Contraseña incorrecta',
        });
      }

      if (!isHashedPassword(user.password)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashPassword(inputPassword) },
        });
      }
    }

    const memberships = user.memberships
      .filter((membership) => membership?.tenant?.isActive !== false)
      .map((membership) => {
        const visits = Number(membership.currentVisits ?? 0);
        const points = visits * 10;

        return {
          tenantId: membership.tenantId,
          name: membership.tenant?.name,
          prize: membership.tenant?.prize ?? 'Premio Sorpresa',
          instagram: membership.tenant?.instagram ?? '',
          requiredVisits: membership.tenant?.requiredVisits ?? 10,
          rewardPeriod: membership.tenant?.rewardPeriod ?? 'OPEN',
          logoData: membership.tenant?.logoData ?? '',
          visits,
          points,
        };
      });

    const sessionToken = generateUserSessionToken({ uid: user.id, phone: user.phone });

    return apiSuccess({
      requestId,
      data: {
        id: user.id,
        phone: user.phone,
        name: user.name ?? '',
        email: user.email ?? '',
        gender: user.gender ?? '',
        birthDate: user.birthDate ?? null,
        memberships,
        sessionToken,
      },
    });
  } catch (error: unknown) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Error')
        : 'Error';

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message,
    });
  }
}
