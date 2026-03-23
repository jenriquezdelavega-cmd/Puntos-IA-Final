import { prisma } from '@/app/lib/prisma';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';
import { generateUserSessionToken } from '@/app/lib/user-session-token';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  buildPhoneLookupCandidates,
  isValidPhone,
  normalizePhone,
  parseJsonObject,
  parseWithSchema,
  requiredString,
} from '@/app/lib/request-validation';


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

    const phoneInput = parsedBody.data.phone;
    if (!isValidPhone(phoneInput)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Formato de teléfono inválido',
      });
    }

    const normalizedPhone = normalizePhone(phoneInput);
    const phoneCandidates = buildPhoneLookupCandidates(phoneInput);
    const exactPhoneCandidates = Array.from(
      new Set([
        ...phoneCandidates,
        ...(normalizedPhone ? [normalizedPhone] : []),
      ]),
    ).filter(Boolean);

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

    let user = await prisma.user.findFirst({
      where: {
        phone: {
          in: exactPhoneCandidates,
        },
      },
      select: {
        id: true,
        phone: true,
        password: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        gender: true,
        birthDate: true,
      },
    });

    if (!user && normalizedPhone) {
      user = await prisma.user.findFirst({
        where: {
          phone: {
            endsWith: normalizedPhone,
          },
        },
        select: {
          id: true,
          phone: true,
          password: true,
          name: true,
          email: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          gender: true,
          birthDate: true,
        },
      });
    }

    if (!user) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Usuario no existe',
      });
    }

    if (normalizedPhone && user.phone !== normalizedPhone) {
      // Best effort: keep canonical phone format moving forward.
      const existingCanonical = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      if (!existingCanonical || existingCanonical.id === user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone: normalizedPhone },
        });
      }
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

    const membershipsResult = await prisma.membership.findMany({
      where: {
        userId: user.id,
        tenant: {
          isActive: true,
        },
      },
      select: {
        tenantId: true,
        currentVisits: true,
        tenant: {
          select: {
            name: true,
            prize: true,
            instagram: true,
            requiredVisits: true,
            loyaltyMilestones: {
              orderBy: { visitTarget: 'asc' },
              select: { id: true, visitTarget: true, reward: true, emoji: true },
            },
          },
        },
      },
    });

    const memberships = membershipsResult.map((membership) => {
        const visits = Number(membership.currentVisits ?? 0);
        const points = visits * 10;

        return {
          tenantId: membership.tenantId,
          name: membership.tenant?.name,
          prize: membership.tenant?.prize ?? 'Premio Sorpresa',
          instagram: membership.tenant?.instagram ?? '',
          requiredVisits: membership.tenant?.requiredVisits ?? 10,
          rewardPeriod: 'OPEN',
          logoData: '',
          visits,
          points,
          milestones: membership.tenant?.loyaltyMilestones ?? [],
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
        emailVerified: Boolean(user.emailVerifiedAt),
        phoneOtpVerified: Boolean(user.phoneVerifiedAt),
        phoneOtpVerificationEnabled: false,
        emailVerificationPending: Boolean(user.email) && !user.emailVerifiedAt,
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
