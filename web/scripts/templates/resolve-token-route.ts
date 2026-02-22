import { NextResponse } from 'next/server';
import { verifyCustomerToken } from '@/app/lib/customer-token';

function extractToken(value: string) {
  const raw = String(value || '').trim();
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function decodeCidWithoutSignature(token: string) {
  const [encodedPayload] = String(token || '').split('.');
  if (!encodedPayload) return '';

  try {
    const json = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { cid?: string };
    const cid = String(parsed?.cid || '').trim();
    return isUuid(cid) ? cid : '';
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawInput = String(body?.token || body?.qrValue || '').trim();
    const token = extractToken(rawInput);
    if (!token) {
      return NextResponse.json({ error: 'token requerido' }, { status: 400 });
    }

    try {
      const payload = verifyCustomerToken(token);
      return NextResponse.json({ customerId: payload.cid });
    } catch (error: unknown) {
      const fallbackCustomerId = decodeCidWithoutSignature(token);
      if (fallbackCustomerId) {
        return NextResponse.json({ customerId: fallbackCustomerId, warning: 'token_signature_invalid_fallback' });
      }
      throw error;
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo resolver QR' },
      { status: 400 }
    );
  }
}
