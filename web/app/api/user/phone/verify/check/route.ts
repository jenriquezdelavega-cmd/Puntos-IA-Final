import { prisma } from '@/app/lib/prisma';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { buildPhoneLookupCandidates, normalizePhone, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { isPhoneVerificationCodeMatch, isPhoneVerificationEnabled } from '@/app/lib/phone-verification';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    if (!isPhoneVerificationEnabled()) {
      return apiError({ requestId, status: 503, code: 'INTERNAL_ERROR', message: 'Verificación de teléfono no disponible por el momento' });
    }

    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, { phone: requiredString, code: requiredString });
    if (!parsedBody.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: `Campo inválido: ${String(parsedBody.field)}` });
    }

    const phoneInput = parsedBody.data.phone;
    const normalizedPhone = normalizePhone(phoneInput);
    const phoneCandidates = buildPhoneLookupCandidates(phoneInput);

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('user-phone-verify-check', request, normalizedPhone || phoneInput),
      limit: 8,
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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: { in: phoneCandidates } },
          ...(normalizedPhone ? [{ phone: { endsWith: normalizedPhone } }] : []),
        ],
      },
      select: { id: true, phone: true },
    });

    if (!user) {
      return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Usuario no encontrado' });
    }

    const latestCode = await prisma.phoneVerificationCode.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        codeHash: true,
        expiresAt: true,
        attempts: true,
      },
    });

    if (!latestCode || latestCode.expiresAt.getTime() < Date.now()) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Código de verificación inválido o expirado' });
    }

    const isValid = isPhoneVerificationCodeMatch(parsedBody.data.code, latestCode.codeHash);
    if (!isValid) {
      await prisma.phoneVerificationCode.update({
        where: { id: latestCode.id },
        data: {
          attempts: { increment: 1 },
          ...(latestCode.attempts >= 4 ? { usedAt: new Date() } : {}),
        },
      });
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Código de verificación inválido o expirado' });
    }

    await prisma.$transaction([
      prisma.phoneVerificationCode.update({
        where: { id: latestCode.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      }),
    ]);

    return apiSuccess({ requestId, data: { verified: true, message: 'Teléfono verificado correctamente' } });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message || 'Error')
      : 'Error';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}
