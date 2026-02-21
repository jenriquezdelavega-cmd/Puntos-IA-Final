#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Escribiendo endpoint resolve-token..."
mkdir -p web/app/api/pass/resolve-token
cat > web/app/api/pass/resolve-token/route.ts <<'TS'
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
TS

echo "[2/4] Actualizando helper customer-token..."
cat > web/app/lib/customer-token.ts <<'TS'
import { createHmac, timingSafeEqual } from 'crypto';

export type CustomerQrPayload = {
  cid: string;
  iat: number;
  v: 1;
};

function b64url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

export function generateCustomerToken(customerId: string) {
  const cid = String(customerId || '').trim();
  if (!cid) throw new Error('customerId requerido');

  const payload: CustomerQrPayload = {
    cid,
    iat: Math.floor(Date.now() / 1000),
    v: 1,
  };

  const encodedPayload = b64url(JSON.stringify(payload));
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) throw new Error('QR_TOKEN_SECRET no configurado');

  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyCustomerToken(token: string): CustomerQrPayload {
  const raw = String(token || '').trim();
  if (!raw) throw new Error('token requerido');

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) throw new Error('token inválido');

  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) throw new Error('QR_TOKEN_SECRET no configurado');

  const expectedSignature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error('token inválido');
  }

  const decodedPayload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  const parsed = JSON.parse(decodedPayload) as CustomerQrPayload;
  if (!parsed?.cid || parsed?.v !== 1) throw new Error('token inválido');
  return parsed;
}
TS

echo "[3/4] Aplicando mejoras de cámara al admin/page.tsx..."
cp web/scripts/templates/admin_page_scan.tsx web/app/admin/page.tsx

echo "[3.1/4] Confirmando que no quedó la pestaña Pases..."
if rg -n "setTab\('passes'\)|tab === 'passes'" web/app/admin/page.tsx >/dev/null; then
  echo "ERROR: aún existe sección 'passes' en admin/page.tsx"
  exit 1
fi

echo "[4/4] Validando lint"
cd web
npx eslint app/api/pass/resolve-token/route.ts app/lib/customer-token.ts
npx eslint app/admin/page.tsx --rule '@typescript-eslint/no-explicit-any: off' --rule '@typescript-eslint/no-unused-vars: off'

echo ""
echo "Listo. Ahora sube cambios con:"
echo "cd ~/workspace"
echo "git add web/app/admin/page.tsx web/app/api/pass/resolve-token/route.ts web/app/lib/customer-token.ts web/scripts/replit_apply_admin_scan_flow.sh web/scripts/templates/admin_page_scan.tsx"
echo "git commit -m 'fix(admin): recover scanner flow with stable template'"
echo "git pull --rebase origin feat/admin-scan-qr"
echo "git push -u origin feat/admin-scan-qr"
