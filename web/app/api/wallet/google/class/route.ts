import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  getGoogleWalletClassId,
  getGoogleWalletIssuerId,
  googleWalletConfigErrorResponse,
  upsertGoogleLoyaltyClass,
} from '@/app/lib/google-wallet';

export const runtime = 'nodejs';

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
    const result = await upsertGoogleLoyaltyClass();

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
          operation: 'updated',
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
        classId: result.classId || getGoogleWalletClassId(),
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
