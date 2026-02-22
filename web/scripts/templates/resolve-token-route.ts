import { NextResponse } from 'next/server';
import { verifyCustomerToken } from '@/app/lib/customer-token';

function extractToken(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('token');
    if (fromQuery) return fromQuery;
    const match = url.pathname.match(/\/v\/([^/]+)$/);
    return match?.[1] || '';
  } catch {
    if (raw.includes('/v/')) {
      const match = raw.match(/\/v\/([^/?#]+)/);
      if (match?.[1]) return match[1];
    }
    return raw;
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
