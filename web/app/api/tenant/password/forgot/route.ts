import { prisma } from '@/app/lib/prisma';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { generatePasswordResetToken, getPasswordResetExpiryDate, hashPasswordResetToken } from '@/app/lib/password-reset';
import { sendPasswordResetEmail } from '@/app/lib/email';
import { logApiEvent } from '@/app/lib/api-log';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, { email: requiredString });
    if (!parsedBody.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: `Campo inválido: ${String(parsedBody.field)}` });
    }

    const email = parsedBody.data.email.toLowerCase();
    if (!isValidEmail(email)) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Email inválido' });
    }

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('tenant-password-forgot', request, email),
      limit: 5,
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

    const tenantUsers = await prisma.tenantUser.findMany({
      where: {
        email: { equals: email, mode: 'insensitive' },
        role: 'ADMIN',
      },
    });
    let emailDelivery: 'sent' | 'not_configured' | 'failed' | 'accepted' = 'accepted';

    if (tenantUsers.length > 0) {
      const configuredBaseUrl = String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
      const fallbackBaseUrl = new URL(request.url).origin;
      const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/$/, '');

      let hadSent = false;
      let hadConfiguredSkip = false;
      let hadFailure = false;

      for (const tenantUser of tenantUsers) {
        await prisma.tenantUserPasswordResetToken.deleteMany({ where: { tenantUserId: tenantUser.id, usedAt: null } });

        const rawToken = generatePasswordResetToken();
        const tokenHash = hashPasswordResetToken(rawToken);

        await prisma.tenantUserPasswordResetToken.create({
          data: {
            tenantUserId: tenantUser.id,
            tokenHash,
            expiresAt: getPasswordResetExpiryDate(),
          },
        });

        const resetUrl = `${baseUrl}/recuperar?scope=tenant&token=${encodeURIComponent(rawToken)}`;
        const emailResult = await sendPasswordResetEmail({ to: email, resetUrl, name: tenantUser.name });
        if (!emailResult.ok) {
          hadFailure = true;
          logApiEvent('/api/tenant/password/forgot', 'password_reset_email_failed', {
            tenantUserId: tenantUser.id,
            reason: emailResult.error || 'unknown',
          });
          continue;
        }
        if (emailResult.skipped) {
          hadConfiguredSkip = true;
          logApiEvent('/api/tenant/password/forgot', 'password_reset_email_skipped', {
            tenantUserId: tenantUser.id,
          });
          continue;
        }
        hadSent = true;
      }

      if (hadSent) {
        emailDelivery = 'sent';
      } else if (hadConfiguredSkip) {
        emailDelivery = 'not_configured';
      } else if (hadFailure) {
        emailDelivery = 'failed';
      }
    }

    return apiSuccess({
      requestId,
      data: {
        message: 'Si el correo existe en Punto IA, te enviamos instrucciones para recuperar tu contraseña.',
        emailDelivery,
      },
    });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: string }).message || 'Error') : 'Error';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}
