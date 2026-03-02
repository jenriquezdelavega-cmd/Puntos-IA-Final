import { prisma } from '@/app/lib/prisma';
import { hashPassword } from '@/app/lib/password';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString, isStrongEnoughPassword } from '@/app/lib/request-validation';
import { hashPasswordResetToken } from '@/app/lib/password-reset';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      token: requiredString,
      password: requiredString,
    });

    if (!parsedBody.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: `Campo inválido: ${String(parsedBody.field)}` });
    }

    const { token, password } = parsedBody.data;
    if (!isStrongEnoughPassword(password)) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const now = new Date();
    const tokenHash = hashPasswordResetToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Token inválido o expirado' });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashPassword(password) },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: { not: resetToken.id },
        },
      }),
    ]);

    return apiSuccess({ requestId, data: { message: 'Contraseña actualizada correctamente.' } });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: string }).message || 'Error') : 'Error';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}
