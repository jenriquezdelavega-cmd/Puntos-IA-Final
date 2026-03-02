import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  getGoogleServiceAccountAccessToken,
  getGoogleWalletClassId,
  getGoogleWalletIssuerId,
  googleWalletConfigErrorResponse,
} from '@/app/lib/google-wallet';

export const runtime = 'nodejs';

const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const WALLET_CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';

async function parseGoogleResponse(response: Response) {
  const responseText = await response.text();
  if (!responseText) return null;

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return { raw: responseText };
  }
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
    const accessToken = await getGoogleServiceAccountAccessToken([WALLET_SCOPE]);

    const payload = {
      id: getGoogleWalletClassId(),
      issuerName: 'Punto IA',
      programName: 'Punto IA',
      countryCode: 'MX',
      reviewStatus: 'UNDER_REVIEW',
      textModulesData: [
        {
          id: 'uso',
          header: 'Cómo usar tu pase',
          body: 'Muestra el QR al pagar para registrar tu visita.',
        },
      ],
      classTemplateInfo: {
        cardTemplateOverride: {
          cardRowTemplateInfos: [
            {
              oneItem: {
                item: {
                  firstValue: {
                    fields: [{ fieldPath: "object.textModulesData['meta-visitas']" }],
                  },
                },
              },
            },
            {
              twoItems: {
                startItem: {
                  firstValue: {
                    fields: [{ fieldPath: "object.textModulesData['faltan']" }],
                  },
                },
                endItem: {
                  firstValue: {
                    fields: [{ fieldPath: "object.textModulesData['premio']" }],
                  },
                },
              },
            },
          ],
        },
      },
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const createResponse = await fetch(WALLET_CLASS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (createResponse.status === 200 || createResponse.status === 201) {
      return apiSuccess({
        requestId,
        status: createResponse.status,
        data: {
          class: await parseGoogleResponse(createResponse),
          operation: 'created',
        },
      });
    }

    if (createResponse.status === 409) {
      const updateResponse = await fetch(`${WALLET_CLASS_URL}/${encodeURIComponent(payload.id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });

      const updateBody = await parseGoogleResponse(updateResponse);

      if (updateResponse.ok) {
        return apiSuccess({
          requestId,
          status: 200,
          data: {
            class: updateBody,
            operation: 'updated',
          },
        });
      }

      return apiError({
        requestId,
        status: updateResponse.status,
        code: 'INTERNAL_ERROR',
        message: 'Google Wallet class exists but update failed',
        details: {
          classId: payload.id,
          body: updateBody,
        },
      });
    }

    return apiError({
      requestId,
      status: createResponse.status,
      code: 'INTERNAL_ERROR',
      message: 'Google Wallet API request failed',
      details: {
        status: createResponse.status,
        body: await parseGoogleResponse(createResponse),
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
