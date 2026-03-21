import { prisma } from '@/app/lib/prisma';
import { hashPassword, verifyPassword } from '@/app/lib/password';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString, isStrongEnoughPassword } from '@/app/lib/request-validation';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { sendPasswordResetSuccessEmail } from '@/app/lib/email';
import { logApiEvent } from '@/app/lib/api-log';

function accessStatusToCode(status: number) {
  if (status === 400) return 'BAD_REQUEST' as const;
  if (status === 401) return 'UNAUTHORIZED' as const;
  if (status === 403) return 'FORBIDDEN' as const;
  if (status === 404) return 'NOT_FOUND' as const;
  return 'INTERNAL_ERROR' as const;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      tenantId: requiredString,
      tenantUserId: requiredString,
      tenantSessionToken: requiredString,
      currentPassword: requiredString,
      newPassword: requiredString,
    });

    if (!parsedBody.ok) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: `Campo inválido: ${String(parsedBody.field)}` });
    }

    const { tenantId, tenantUserId, tenantSessionToken, currentPassword, newPassword } = parsedBody.data;

    const access = await requireTenantRoleAccess({
      tenantId,
      tenantUserId,
      tenantSessionToken,
      allowedRoles: ['ADMIN', 'STAFF'],
    });

    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    if (!isStrongEnoughPassword(newPassword)) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (currentPassword === newPassword) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'La nueva contraseña debe ser distinta a la actual' });
    }

    const tenantUser = await prisma.tenantUser.findFirst({
      where: { id: access.userId, tenantId: access.tenantId },
      select: { id: true, password: true, email: true, name: true },
    });

    if (!tenantUser || !verifyPassword(currentPassword, tenantUser.password)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'Contraseña actual incorrecta' });
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.tenantUser.update({
        where: { id: tenantUser.id },
        data: {
          password: hashPassword(newPassword),
          mustChangePassword: false,
          passwordChangedAt: now,
        },
      }),
      prisma.tenantUserPasswordResetToken.deleteMany({
        where: {
          tenantUserId: tenantUser.id,
          usedAt: null,
        },
      }),
    ]);

    let emailDelivery: 'sent' | 'not_configured' | 'failed' | 'skipped_no_email' = 'skipped_no_email';
    if (tenantUser.email) {
      const emailResult = await sendPasswordResetSuccessEmail({ to: tenantUser.email, name: tenantUser.name });
      if (!emailResult.ok) {
        emailDelivery = 'failed';
        logApiEvent('/api/tenant/password/change', 'password_change_confirmation_failed', {
          tenantUserId: tenantUser.id,
          reason: emailResult.error || 'unknown',
        });
      } else if (emailResult.skipped) {
        emailDelivery = 'not_configured';
        logApiEvent('/api/tenant/password/change', 'password_change_confirmation_skipped', {
          tenantUserId: tenantUser.id,
        });
      } else {
        emailDelivery = 'sent';
      }
    }

    return apiSuccess({ requestId, data: { message: 'Contraseña cambiada correctamente', emailDelivery } });
  } catch (error: unknown) {
    const message = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: string }).message || 'Error') : 'Error';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}
