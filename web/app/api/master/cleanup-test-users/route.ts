import { apiError, getRequestId } from '@/app/lib/api-response';

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  return apiError({
    requestId,
    status: 410,
    code: 'GONE',
    message: 'La limpieza de usuarios de prueba fue deshabilitada en esta versión.',
  });
}
