import { prisma } from '@/app/lib/prisma';
import { getTenantWalletStyle, upsertTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { logApiError } from '@/app/lib/api-log';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { parseOptionalRequiredVisits } from '@/app/lib/loyalty-program';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import { requestWalletRefreshForTenant } from '@/app/lib/wallet-sync-orchestrator';

function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const tenantId = asTrimmedString(body.tenantId);
    const tenantUserId = asTrimmedString(body.tenantUserId);
    const tenantSessionToken = asTrimmedString(body.tenantSessionToken);
    const prize = asTrimmedString(body.prize);
    const requiredVisits = body.requiredVisits;
    const rewardPeriod = asTrimmedString(body.rewardPeriod);
    const lat = body.lat;
    const lng = body.lng;
    const address = asTrimmedString(body.address);
    const instagram = asTrimmedString(body.instagram);
    const logoData = asTrimmedString(body.logoData);
    const walletBackgroundColor = asTrimmedString(body.walletBackgroundColor);
    const walletForegroundColor = asTrimmedString(body.walletForegroundColor);
    const walletLabelColor = asTrimmedString(body.walletLabelColor);
    const walletStripImageData = asTrimmedString(body.walletStripImageData);
    const coalitionOptIn = typeof body.coalitionOptIn === 'boolean' ? body.coalitionOptIn : undefined;
    const coalitionDiscountPercentRaw = body.coalitionDiscountPercent;
    const coalitionProduct = asTrimmedString(body.coalitionProduct);

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const authorizedTenantId = access.tenantId;

    const parsedVisits = parseOptionalRequiredVisits(requiredVisits);

    const allowedPeriods = ['OPEN', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL'] as const;
    type RewardPeriodValue = (typeof allowedPeriods)[number];
    const parsedRewardPeriod = (allowedPeriods as readonly string[]).includes(rewardPeriod)
      ? (rewardPeriod as RewardPeriodValue)
      : undefined;

    const parsedCoalitionDiscount =
      coalitionDiscountPercentRaw === undefined || coalitionDiscountPercentRaw === null || coalitionDiscountPercentRaw === ''
        ? undefined
        : Math.max(0, parseInt(String(coalitionDiscountPercentRaw), 10));

    let effectiveCoalitionDiscount = parsedCoalitionDiscount;
    if (effectiveCoalitionDiscount === undefined && coalitionOptIn === true) {
      const currentTenant = await prisma.tenant.findUnique({
        where: { id: authorizedTenantId },
        select: { coalitionDiscountPercent: true },
      });
      effectiveCoalitionDiscount = currentTenant?.coalitionDiscountPercent;
    }

    if (coalitionOptIn === true && (effectiveCoalitionDiscount ?? 0) < 10) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Para activar la promo de coalición debes ofrecer mínimo 10% de descuento',
      });
    }


    if (coalitionOptIn === true && !coalitionProduct) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Para activar la promo de coalición debes indicar el producto participante',
      });
    }

    const updated = await prisma.tenant.update({
      where: { id: authorizedTenantId },
      data: {
        ...(prize !== undefined && prize !== null ? { prize } : {}),
        ...(instagram !== undefined && instagram !== null ? { instagram } : {}),
        ...(address !== undefined && address !== null ? { address } : {}),
        ...(lat !== undefined && lat !== null && lat !== '' ? { lat: parseFloat(String(lat)) } : {}),
        ...(lng !== undefined && lng !== null && lng !== '' ? { lng: parseFloat(String(lng)) } : {}),
        ...(parsedVisits !== undefined ? { requiredVisits: parsedVisits } : {}),
        ...(parsedRewardPeriod ? { rewardPeriod: parsedRewardPeriod } : {}),
        ...(logoData !== undefined && logoData !== null ? { logoData } : {}),
        ...(coalitionOptIn !== undefined ? { coalitionOptIn } : {}),
        ...(parsedCoalitionDiscount !== undefined ? { coalitionDiscountPercent: parsedCoalitionDiscount } : {}),
        ...(coalitionProduct !== undefined && coalitionProduct !== null ? { coalitionProduct } : {}),
      },
    });

    await upsertTenantWalletStyle({
      tenantId: authorizedTenantId,
      backgroundColor: walletBackgroundColor as string | undefined,
      foregroundColor: walletForegroundColor as string | undefined,
      labelColor: walletLabelColor as string | undefined,
      stripImageData: walletStripImageData as string | null | undefined,
    });

    const walletStyle = await getTenantWalletStyle(authorizedTenantId);

    try {
      await requestWalletRefreshForTenant({
        prisma,
        tenantId: authorizedTenantId,
        origin: new URL(request.url).origin,
        reason: 'tenant-settings',
        forceImmediate: true,
      });
    } catch (walletSyncError) {
      logApiError('/api/tenant/settings#wallet-sync', walletSyncError);
    }

    return apiSuccess({
      requestId,
      data: {
        success: true,
        tenant: {
          ...updated,
          walletBackgroundColor: walletStyle?.backgroundColor || null,
          walletForegroundColor: walletStyle?.foregroundColor || null,
          walletLabelColor: walletStyle?.labelColor || null,
          walletStripImageData: walletStyle?.stripImageData || '',
        },
      },
    });
  } catch (e: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Error',
    });
  }
}
