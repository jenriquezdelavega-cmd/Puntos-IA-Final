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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawInput = String(body?.token || body?.qrValue || '').trim();
    const token = extractToken(rawInput);
    if (!token) {
      return NextResponse.json({ error: 'token requerido' }, { status: 400 });
    }

    const payload = verifyCustomerToken(token);
    return NextResponse.json({ customerId: payload.cid });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo resolver QR' },
      { status: 400 }
    );
  }
}
