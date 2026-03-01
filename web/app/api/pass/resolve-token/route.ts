import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { verifyCustomerToken } from '@/app/lib/customer-token';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';

function extractToken(value: string) {
  const raw = asTrimmedString(value);
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('token');
    if (fromQuery) return fromQuery;

    const path = decodeURIComponent(url.pathname || '');
    const match = path.match(/\/v\/([^/?#]+)\/?$/);
    return match?.[1] || '';
  } catch {
    const decodedRaw = decodeURIComponent(raw);
    if (decodedRaw.includes('/v/')) {
      const match = decodedRaw.match(/\/v\/([^/?#]+)\/?/);
      if (match?.[1]) return match[1];
    }
    return decodedRaw;
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);

  try {
    const body = await parseJsonObject(req);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const rawInput = asTrimmedString(body?.token || body?.qrValue);
    const token = extractToken(rawInput);
    if (!token) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'token requerido',
      });
    }

    const payload = verifyCustomerToken(token);
    return apiSuccess({
      requestId,
      data: { customerId: payload.cid },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 400,
      code: 'BAD_REQUEST',
      message: error instanceof Error ? error.message : 'No se pudo resolver QR',
    });
  }
}
