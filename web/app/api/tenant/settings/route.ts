import { prisma } from '@/app/lib/prisma';
import { getTenantWalletStyle, upsertTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { touchWalletPassRegistrations } from '@/app/lib/apple-wallet-webservice';
import { pushWalletUpdateToDevice, deleteWalletRegistrationsByPushToken } from '@/app/lib/apple-wallet-push';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';

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

    const parsedVisits =
      requiredVisits === undefined || requiredVisits === null || requiredVisits === ''
        ? undefined
        : Math.max(1, parseInt(String(requiredVisits), 10));

    const allowedPeriods = ['OPEN', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL'] as const;
    type RewardPeriodValue = (typeof allowedPeriods)[number];
    const parsedRewardPeriod = (allowedPeriods as readonly string[]).includes(rewardPeriod)
      ? (rewardPeriod as RewardPeriodValue)
      : undefined;

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
      const passTypeIdentifier = asTrimmedString(process.env.APPLE_PASS_TYPE_ID);
      if (passTypeIdentifier) {
        const regs = await prisma.$queryRawUnsafe<Array<{ push_token: string; serial_number: string }>>(
          `SELECT DISTINCT push_token, serial_number FROM apple_wallet_registrations WHERE serial_number LIKE $1 AND pass_type_identifier = $2`,
          `%-${authorizedTenantId}`,
          passTypeIdentifier,
        );

        for (const reg of regs) {
          await touchWalletPassRegistrations(prisma, { serialNumber: reg.serial_number, passTypeIdentifier });
        }

        const seen = new Set<string>();
        for (const reg of regs) {
          const token = asTrimmedString(reg.push_token);
          if (!token || seen.has(token)) continue;
          seen.add(token);
          const result = await pushWalletUpdateToDevice(token, passTypeIdentifier);
          if (!result.ok && (result.status === 410 || result.status === 400)) {
            await deleteWalletRegistrationsByPushToken(prisma, token);
          }
        }

        logApiEvent('/api/tenant/settings', 'settings_push_sent', { tenantId: authorizedTenantId, devices: seen.size });
      }
    } catch (pushErr) {
      logApiError('/api/tenant/settings#wallet-push', pushErr);
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
