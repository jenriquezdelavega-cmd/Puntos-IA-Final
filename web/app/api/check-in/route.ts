import { apiError, getRequestId } from '@/app/lib/api-response';

// Legacy endpoint intentionally disabled.
// Use POST /api/check-in/scan with tenantUserId guard instead.
export async function POST(request: Request) {
  return apiError({
    requestId: getRequestId(request),
    status: 410,
    code: 'BAD_REQUEST',
    message: 'Endpoint obsoleto. Usa /api/check-in/scan.',
  });
}
