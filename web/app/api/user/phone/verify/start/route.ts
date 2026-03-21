import { prisma } from '@/app/lib/prisma';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { buildPhoneLookupCandidates, normalizePhone, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import {
  generatePhoneVerificationCode,
  hashPhoneVerificationCode,
  isPhoneVerificationEnabled,
  sendWhatsAppVerificationCode,
} from '@/app/lib/phone-verification';

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

    const parsedBody = parseWithSchema(body, { phone: requiredString });
    if (!parsedBody.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: `Campo inválido: ${String(parsedBody.field)}` });
    }

    const phoneInput = parsedBody.data.phone;
    const normalizedPhone = normalizePhone(phoneInput);
    const phoneCandidates = buildPhoneLookupCandidates(phoneInput);

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('user-phone-verify-start', request, normalizedPhone || phoneInput),
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

    const code = generatePhoneVerificationCode();
    const codeHash = hashPhoneVerificationCode(code);
    await prisma.phoneVerificationCode.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    await prisma.phoneVerificationCode.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const result = await sendWhatsAppVerificationCode(user.phone, code);
    if (!result.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'No fue posible enviar el código de verificación' });
    }

    return apiSuccess({
      requestId,
      data: {
        sent: true,
        message: 'Código enviado por WhatsApp',
      },
    });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message || 'Error')
      : 'Error';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}
