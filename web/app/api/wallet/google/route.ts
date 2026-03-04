import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { getGoogleWalletIssuerId, googleWalletConfigErrorResponse, parseGoogleServiceAccount, signSaveToWalletJwt } from '@/app/lib/google-wallet';
import { getGoogleLoyaltyObjectId, syncGoogleLoyaltyObjectForCustomer } from '@/app/lib/google-wallet-object-sync';
import { asTrimmedString } from '@/app/lib/request-validation';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const requestId = getRequestId(req);

  try {
    const issuerId = getGoogleWalletIssuerId();

    if (!issuerId) {
      return apiError({
        requestId,
        status: 500,
        code: 'INTERNAL_ERROR',
        message: googleWalletConfigErrorResponse().error,
      });
    }

    const url = new URL(req.url);
    const customerId = asTrimmedString(url.searchParams.get('customerId'));
    const businessId = asTrimmedString(url.searchParams.get('businessId'));

    if (!customerId || !businessId) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'customerId y businessId son requeridos',
      });
    }

    const account = parseGoogleServiceAccount();
    const syncResult = await syncGoogleLoyaltyObjectForCustomer({
      tenantId: businessId,
      userId: customerId,
      origin: new URL(req.url).origin,
    });

    if (!syncResult.ok) {
      return apiError({
        requestId,
        status: syncResult.reason === 'not_found' ? 404 : 500,
        code: syncResult.reason === 'not_found' ? 'NOT_FOUND' : 'INTERNAL_ERROR',
        message: syncResult.reason === 'not_found' ? 'Cliente o negocio no encontrado' : 'No se pudo sincronizar el pase de Google Wallet',
      });
    }

    const objectId = syncResult.objectId || getGoogleLoyaltyObjectId(issuerId, businessId, customerId);
    const token = signSaveToWalletJwt(
      {
        iss: account.client_email,
        aud: 'google',
        typ: 'savetowallet',
        payload: {
          loyaltyObjects: [{ id: objectId }],
        },
      },
      account.private_key || '',
    );

    return apiSuccess({
      requestId,
      data: {
        saveUrl: `https://pay.google.com/gp/v/save/${token}`,
        classId: syncResult.classId || '',
        objectId,
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
