import { prisma } from '@/app/lib/prisma';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';
import { defaultTenantWalletStyle, getTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { generateTenantSessionToken } from '@/app/lib/tenant-session-token';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const parsedBody = parseWithSchema(body, {
      username: requiredString,
      password: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { username, password } = parsedBody.data;

    const user = await prisma.tenantUser.findUnique({
      where: { username },
      include: { tenant: true },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Credenciales incorrectas',
      });
    }

    if (!isHashedPassword(user.password)) {
      await prisma.tenantUser.update({
        where: { id: user.id },
        data: { password: hashPassword(password) },
      });
    }

    if (user.tenant.isActive === false) {
      return apiError({
        requestId,
        status: 403,
        code: 'FORBIDDEN',
        message: 'Este negocio ha sido suspendido. Contacta a soporte.',
      });
    }

    const walletStyle = (await getTenantWalletStyle(user.tenant.id)) || defaultTenantWalletStyle(user.tenant.id);
    const tenantSessionToken = generateTenantSessionToken({ tenantUserId: user.id, tenantId: user.tenant.id, role: user.role });

    return apiSuccess({
      requestId,
      data: {
        success: true,
        user: { id: user.id, name: user.name, role: user.role },
        tenantSessionToken,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          prize: user.tenant.prize,
          instagram: user.tenant.instagram,
          lat: user.tenant.lat,
          lng: user.tenant.lng,
          address: user.tenant.address,
          requiredVisits: user.tenant.requiredVisits,
          rewardPeriod: user.tenant.rewardPeriod,
          logoData: user.tenant.logoData,
          walletBackgroundColor: walletStyle.backgroundColor,
          walletForegroundColor: walletStyle.foregroundColor,
          walletLabelColor: walletStyle.labelColor,
          walletStripImageData: walletStyle.stripImageData,
        },
      },
    });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error interno',
    });
  }
}
