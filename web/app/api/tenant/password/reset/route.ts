import { prisma } from '@/app/lib/prisma';
import { hashPassword } from '@/app/lib/password';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString, isStrongEnoughPassword } from '@/app/lib/request-validation';
import { hashPasswordResetToken } from '@/app/lib/password-reset';
import { sendPasswordResetSuccessEmail } from '@/app/lib/email';
import { logApiEvent } from '@/app/lib/api-log';

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

    const resetToken = await prisma.tenantUserPasswordResetToken.findUnique({
      where: { tokenHash },
      include: { tenantUser: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Token inválido o expirado' });
    }
    if (String(resetToken.tenantUser.role || '').toUpperCase() !== 'ADMIN') {
      return apiError({ requestId, status: 403, code: 'FORBIDDEN', message: 'Solo administradores pueden restablecer contraseña por este flujo' });
    }

    await prisma.$transaction([
      prisma.tenantUser.update({
        where: { id: resetToken.tenantUserId },
        data: { password: hashPassword(password) },
      }),
      prisma.tenantUserPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
      prisma.tenantUserPasswordResetToken.deleteMany({
        where: {
          tenantUserId: resetToken.tenantUserId,
          usedAt: null,
          id: { not: resetToken.id },
        },
      }),
    ]);

    let emailDelivery: 'sent' | 'not_configured' | 'failed' | 'skipped_no_email' = 'skipped_no_email';
    if (resetToken.tenantUser.email) {
      const emailResult = await sendPasswordResetSuccessEmail({
        to: resetToken.tenantUser.email,
        name: resetToken.tenantUser.name,
      });
      if (!emailResult.ok) {
        emailDelivery = 'failed';
        logApiEvent('/api/tenant/password/reset', 'password_reset_confirmation_failed', {
          tenantUserId: resetToken.tenantUserId,
          reason: emailResult.error || 'unknown',
        });
      } else if (emailResult.skipped) {
        emailDelivery = 'not_configured';
        logApiEvent('/api/tenant/password/reset', 'password_reset_confirmation_skipped', {
          tenantUserId: resetToken.tenantUserId,
        });
      } else {
        emailDelivery = 'sent';
      }
    }

    return apiSuccess({ requestId, data: { message: 'Contraseña actualizada correctamente.', emailDelivery } });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: string }).message || 'Error') : 'Error';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}
