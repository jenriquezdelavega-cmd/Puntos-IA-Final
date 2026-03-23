import { prisma } from '@/app/lib/prisma';
import { hashPassword } from '@/app/lib/password';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  asTrimmedString,
  buildPhoneLookupCandidates,
  isValidPhone,
  isStrongEnoughPassword,
  normalizePhone,
  parseBirthDate,
  parseJsonObject,
  parseWithSchema,
  requiredString,
} from '@/app/lib/request-validation';
import { sendEmailVerificationEmail } from '@/app/lib/email';
import { logApiEvent } from '@/app/lib/api-log';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { generatePasswordResetToken, hashPasswordResetToken } from '@/app/lib/password-reset';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getAgeInYears(birthDate: Date): number {
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birthDate.getUTCMonth();
  const dayDiff = today.getUTCDate() - birthDate.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const parsedBody = parseWithSchema(body, {
      name: requiredString,
      phone: requiredString,
      password: requiredString,
      email: requiredString,
      gender: requiredString,
      birthDate: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { name, phone, password, email, gender, birthDate } = parsedBody.data;
    const normalizedEmail = asTrimmedString(email).toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Email inválido',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidPhone(phone) && !normalizedPhone) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Captura un teléfono válido',
      });
    }

    const phoneCandidates = buildPhoneLookupCandidates(phone);
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('user-register', request, normalizedPhone || normalizedEmail),
      limit: 15,
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

    const [existingUserByPhone, existingUserByEmail] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [
            {
              phone: {
                in: phoneCandidates,
              },
            },
            ...(normalizedPhone
              ? [
                  {
                    phone: {
                      endsWith: normalizedPhone,
                    },
                  },
                ]
              : []),
          ],
        },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      }),
    ]);
    if (existingUserByPhone) {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'Teléfono ya registrado',
      });
    }

    if (existingUserByEmail) {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'Email ya registrado',
      });
    }

    if (!isStrongEnoughPassword(password)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const cleanGender = asTrimmedString(gender);
    if (!['Hombre', 'Mujer', 'Otro'].includes(cleanGender)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Selecciona un género válido',
      });
    }

    const finalDate = parseBirthDate(birthDate);
    if (!finalDate) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Fecha de nacimiento inválida',
      });
    }
    const age = getAgeInYears(finalDate);
    if (age < 5 || age > 100) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'La edad debe estar entre 5 y 100 años',
      });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone || phone,
        phoneVerifiedAt: null,
        email: normalizedEmail,
        emailVerifiedAt: null,
        password: hashPassword(password),
        gender: cleanGender,
        birthDate: finalDate,
      },
    });

    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.deleteMany({ where: { userId: newUser.id, usedAt: null } });
    await prisma.emailVerificationToken.create({
      data: {
        userId: newUser.id,
        tokenHash,
        expiresAt,
      },
    });

    const configuredBaseUrl = String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
    const fallbackBaseUrl = new URL(request.url).origin;
    const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/$/, '');
    const verifyUrl = `${baseUrl}/api/user/email/verify?token=${encodeURIComponent(rawToken)}`;
    const emailResult = await sendEmailVerificationEmail({ to: newUser.email || normalizedEmail, name: newUser.name, verifyUrl });
    let emailStatus: 'sent' | 'not_configured' | 'failed' = 'sent';
    if (!emailResult.ok) {
      emailStatus = 'failed';
      logApiEvent('/api/user/register', 'verification_email_failed', {
        userId: newUser.id,
        reason: emailResult.error || 'unknown',
      });
    } else if (emailResult.skipped) {
      emailStatus = 'not_configured';
      logApiEvent('/api/user/register', 'verification_email_skipped', {
        userId: newUser.id,
      });
    }

    return apiSuccess({
      requestId,
      data: {
        id: newUser.id,
        name: newUser.name,
        emailStatus,
      },
    });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'Teléfono o email ya registrado',
      });
    }

    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Error interno')
        : 'Error interno';

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message,
    });
  }
}
