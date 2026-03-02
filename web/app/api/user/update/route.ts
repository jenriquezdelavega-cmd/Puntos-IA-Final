import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, isValidPhone, normalizeGender, parseBirthDate, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';


export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      id: requiredString,
      sessionToken: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { id: userId, sessionToken } = parsedBody.data;
    const session = verifyUserSessionToken(sessionToken);
    if (session.uid !== userId) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const normalizedPhone = asTrimmedString(body.phone);
    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Formato de teléfono inválido',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: asTrimmedString(body.name) || undefined,
        email: asTrimmedString(body.email) || undefined,
        phone: normalizedPhone || undefined,
        gender: normalizeGender(body.gender),
        birthDate: parseBirthDate(body.birthDate),
      },
    });

    return apiSuccess({ requestId, data: { success: true } });
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

    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return apiError({
        requestId,
        status: 400,
        code: 'CONFLICT',
        message: 'Ese teléfono ya está registrado',
      });
    }

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error al actualizar',
    });
  }
}
