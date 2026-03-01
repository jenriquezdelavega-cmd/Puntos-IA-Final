import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  getGoogleServiceAccountAccessToken,
  getGoogleWalletIssuerId,
  googleWalletConfigErrorResponse,
} from '@/app/lib/google-wallet';

export const runtime = 'nodejs';

const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const WALLET_CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';

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
    const accessToken = await getGoogleServiceAccountAccessToken([WALLET_SCOPE]);

    const payload = {
      id: `${issuerId}.puntoia_loyalty`,
      issuerName: 'Punto IA',
      programName: 'Punto IA',
      countryCode: 'MX',
      reviewStatus: 'UNDER_REVIEW',
    };

    const response = await fetch(WALLET_CLASS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseBody: unknown = null;

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText) as unknown;
      } catch {
        responseBody = { raw: responseText };
      }
    }

    if (response.status === 200 || response.status === 201) {
      return apiSuccess({
        requestId,
        status: response.status,
        data: {
          class: responseBody,
        },
      });
    }

    if (response.status === 409) {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'already exists',
        details: {
          classId: payload.id,
          details: responseBody,
        },
      });
    }

    return apiError({
      requestId,
      status: response.status,
      code: 'INTERNAL_ERROR',
      message: 'Google Wallet API request failed',
      details: {
        status: response.status,
        body: responseBody,
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
