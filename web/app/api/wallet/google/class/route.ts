import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';
import {
  getGoogleWalletClassId,
  getGoogleWalletClassIdForTenant,
  getGoogleWalletIssuerId,
  GOOGLE_WALLET_PROGRAM_NAME_HIDDEN,
  googleWalletConfigErrorResponse,
  upsertGoogleLoyaltyClass,
} from '@/app/lib/google-wallet';

export const runtime = 'nodejs';

function asPublicHttpUrl(value: string | null | undefined) {
  const raw = asTrimmedString(value);
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function resolveBusinessLogoUrl(params: {
  logoValue: string | null | undefined;
  origin: string;
  businessId: string;
}) {
  const directUrl = asPublicHttpUrl(params.logoValue);
  if (directUrl) return directUrl;

  const normalized = asTrimmedString(params.logoValue);
  if (!normalized) return '';

  const imageUrl = new URL('/api/wallet/google/image', params.origin);
  imageUrl.searchParams.set('businessId', params.businessId);
  imageUrl.searchParams.set('kind', 'logo');
  return imageUrl.toString();
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const issuerId = getGoogleWalletIssuerId();

  if (!issuerId) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: googleWalletConfigErrorResponse().error,
    });
  }

  try {
    const url = new URL(request.url);
    const businessId = String(url.searchParams.get('businessId') || '').trim();
    const classId = businessId ? getGoogleWalletClassIdForTenant(businessId) : getGoogleWalletClassId();

    let issuerName: string | undefined;
    let programName: string | undefined;
    let logoUri: string | undefined;

    if (businessId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, logoData: true },
      });

      if (!tenant) {
        return apiError({
          requestId,
          status: 404,
          code: 'NOT_FOUND',
          message: 'Negocio no encontrado',
        });
      }

      const requestOrigin = new URL(request.url).origin;
      const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
      const origin = publicBaseUrl || requestOrigin;

      issuerName = asTrimmedString(tenant.name) || 'Negocio afiliado';
      programName = GOOGLE_WALLET_PROGRAM_NAME_HIDDEN;
      logoUri = resolveBusinessLogoUrl({
        logoValue: tenant.logoData,
        origin,
        businessId: tenant.id,
      }) || undefined;
    }

    const result = await upsertGoogleLoyaltyClass({
      classId,
      issuerName,
      programName,
      logoUri,
    });

    if (result.operation === 'created') {
      return apiSuccess({
        requestId,
        status: result.status,
        data: {
          class: result.body,
          operation: 'created',
        },
      });
    }

    if (result.operation === 'updated') {
      return apiSuccess({
        requestId,
        status: 200,
        data: {
          class: result.body,
          operation: result.operation,
        },
      });
    }

    return apiError({
      requestId,
      status: result.status,
      code: 'INTERNAL_ERROR',
      message: 'Google Wallet API request failed',
      details: {
        status: result.status,
        classId: result.classId || classId || getGoogleWalletClassId(),
        body: result.body,
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}
