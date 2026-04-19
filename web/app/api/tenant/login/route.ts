import { prisma } from '@/app/lib/prisma';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';
import { defaultTenantWalletStyle, getTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { generateTenantSessionToken } from '@/app/lib/tenant-session-token';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { isMissingTableOrColumnError } from '@/app/lib/prisma-error-helpers';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { DEFAULT_BUSINESS_CATEGORY } from '@/app/lib/business-categories';

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
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('tenant-login', request, username.toLowerCase()),
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

    const user = await (async () => {
      try {
        return await prisma.tenantUser.findUnique({
          where: { username },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
            mustChangePassword: true,
            tenant: {
              select: {
                id: true,
                isActive: true,
                name: true,
                slug: true,
                codePrefix: true,
                prize: true,
                instagram: true,
                businessCategory: true,
                lat: true,
                lng: true,
                address: true,
                requiredVisits: true,
                rewardPeriod: true,
                logoData: true,
                ticketControlEnabled: true,
              },
            },
          },
        });
      } catch (error: unknown) {
        if (!isMissingTableOrColumnError(error)) throw error;
        const fallback = await prisma.tenantUser.findUnique({
          where: { username },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
            mustChangePassword: true,
            tenant: {
              select: {
                id: true,
                isActive: true,
                name: true,
                slug: true,
                codePrefix: true,
                prize: true,
                instagram: true,
                lat: true,
                lng: true,
                address: true,
                requiredVisits: true,
                rewardPeriod: true,
                logoData: true,
              },
            },
          },
        });
        if (!fallback) return fallback;
        return {
          ...fallback,
          tenant: {
            ...fallback.tenant,
            businessCategory: DEFAULT_BUSINESS_CATEGORY,
            ticketControlEnabled: false,
          },
        };
      }
    })();

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

    const normalizedRole = String(user.role || '').toUpperCase();
    const ticketControlEnabled =
      'ticketControlEnabled' in user.tenant
        ? Boolean((user.tenant as { ticketControlEnabled?: boolean }).ticketControlEnabled)
        : false;
    let walletStyle = defaultTenantWalletStyle(user.tenant.id);
    try {
      walletStyle = (await getTenantWalletStyle(user.tenant.id)) || walletStyle;
    } catch (error: unknown) {
      if (!isMissingTableOrColumnError(error)) throw error;
    }
    const tenantSessionToken = generateTenantSessionToken({ tenantUserId: user.id, tenantId: user.tenant.id, role: normalizedRole });
    const businessCategory =
      'businessCategory' in user.tenant && typeof user.tenant.businessCategory === 'string'
        ? user.tenant.businessCategory
        : DEFAULT_BUSINESS_CATEGORY;

    return apiSuccess({
      requestId,
      data: {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: normalizedRole,
          mustChangePassword: Boolean(user.mustChangePassword),
        },
        tenantSessionToken,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          codePrefix: user.tenant.codePrefix || user.tenant.slug.substring(0, 4).toUpperCase(),
          prize: user.tenant.prize,
          instagram: user.tenant.instagram,
          businessCategory,
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
          coalitionOptIn: null,
          coalitionDiscountPercent: null,
          coalitionProduct: '',
          ticketControlEnabled,
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
