import { apiError, getRequestId } from '@/app/lib/api-response';

// Legacy endpoint intentionally disabled.
// Use /api/redeem/request + /api/redeem/validate flow with role/session checks.
export async function POST(request: Request) {
  return apiError({
    requestId: getRequestId(request),
    status: 410,
    code: 'BAD_REQUEST',
    message: 'Endpoint obsoleto. Usa /api/redeem/request y /api/redeem/validate.',
  });
}
