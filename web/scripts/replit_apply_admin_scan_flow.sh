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
node <<'NODE'
const fs = require('fs');
const path = 'web/app/admin/page.tsx';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("import { useRef, useState } from 'react';")) {
  s = s.replace("import { useState } from 'react';", "import { useRef, useState } from 'react';");
}

if (!s.includes('const QRScanner = dynamic(() => import(\'@yudiel/react-qr-scanner\')')) {
  const marker = "const AdminMap = dynamic(() => import('../components/AdminMap'), { ssr: false, loading: () => <div className=\"h-full bg-gray-100 animate-pulse text-center pt-10 text-gray-400\">Cargando...</div> });\n";
  const add = "\nconst QRScanner = dynamic(() => import('@yudiel/react-qr-scanner').then((m) => m.Scanner), {\n  ssr: false,\n  loading: () => <div className=\"h-[320px] rounded-2xl bg-gray-100 animate-pulse text-center pt-24 text-gray-400\">Cargando cámara...</div>,\n});\n";
  s = s.replace(marker, marker + add);
}

if (!s.includes('const [scannerOpen, setScannerOpen] = useState(false);')) {
  const needle = "const [redeemCode, setRedeemCode] = useState('');\nconst [msg, setMsg] = useState('');\n";
  const add = "const [scannerOpen, setScannerOpen] = useState(false);\nconst [scannerMsg, setScannerMsg] = useState('');\nconst lastScanRef = useRef<string>('');\n";
  s = s.replace(needle, needle + add);
}

if (!s.includes("const [lastScannedCustomerId, setLastScannedCustomerId] = useState('');")) {
  s = s.replace(
    "const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', role: 'STAFF' });\n",
    "const [newStaff, setNewStaff] = useState({ name: '', username: '', password: '', role: 'STAFF' });\nconst [lastScannedCustomerId, setLastScannedCustomerId] = useState('');\n"
  );
}

if (!s.includes('const resolveScannedCustomerId = async (rawValue: string) => {')) {
  const marker = 'if (!tenant) return';
  const helper = `
const ensureDailyCode = async () => {
  if (code) return code;
  const res = await fetch('/api/admin/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: tenant.id, tenantUserId }),
  });
  const data = await res.json();
  if (!res.ok || !data?.code) throw new Error(data?.error || 'No se pudo generar código diario');
  setCode(data.code);
  return String(data.code);
};

const resolveScannedCustomerId = async (rawValue: string) => {
  const raw = String(rawValue || '').trim();
  if (!raw) throw new Error('QR vacío');

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('customer_id') || url.searchParams.get('customerId');
    if (fromQuery) return fromQuery;
  } catch {}

  const uuidMatch = raw.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  if (uuidMatch?.[0]) return uuidMatch[0];

  const res = await fetch('/api/pass/resolve-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrValue: raw }),
  });
  const data = await res.json();
  if (!res.ok || !data?.customerId) throw new Error(data?.error || 'No se pudo resolver cliente del QR');
  return String(data.customerId);
};

const handleAdminScan = async (rawValue: string) => {
  const raw = String(rawValue || '').trim();
  if (!raw) return;
  if (lastScanRef.current === raw) return;
  lastScanRef.current = raw;

  setScannerMsg('Procesando QR...');
  try {
    const customerId = await resolveScannedCustomerId(raw);
    const todayCode = await ensureDailyCode();

    const res = await fetch('/api/check-in/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: customerId, code: todayCode }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'No se pudo registrar visita');

    setScannerMsg(\`✅ \${data.message || 'Visita registrada'} (\${data.visits}/\${data.requiredVisits})\`);
    setMsg(\`✅ \${data.message || 'Visita registrada'} (\${data.visits}/\${data.requiredVisits})\`);
    setLastScannedCustomerId(customerId);
  } catch (error) {
    const text = error instanceof Error ? error.message : 'Error al escanear';
    setScannerMsg(\`❌ \${text}\`);
    setMsg(\`❌ \${text}\`);
  } finally {
    setTimeout(() => {
      lastScanRef.current = '';
    }, 1200);
  }
};

`;
  s = s.replace(marker, helper + marker);
}

s = s.replace(/\n\s*<button\s+onClick=\{\(\)=>setTab\('passes'\)\}[\s\S]*?<\/button>\n\n/g, '\n\n');
s = s.replace(/\n\{tab === 'passes' && \([\s\S]*?\n\)\}\n\n/g, '\n\n');

const oldBlock = `<button onClick={generateCode} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg">Generar Nuevo</button>\n\n<div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-left">`;
const newBlock = `<button onClick={generateCode} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg">Generar Nuevo</button>\n\n<div className="mt-4 grid gap-2">\n  <button\n    onClick={() => { setScannerOpen(true); setScannerMsg('Apunta al QR del pase del cliente'); }}\n    className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-700"\n  >\n    Abrir cámara para escanear cliente\n  </button>\n  {scannerMsg ? <p className="text-xs font-bold text-gray-600 text-left">{scannerMsg}</p> : null}\n  {lastScannedCustomerId ? <p className="text-[11px] font-mono text-gray-500 text-left">Cliente: {lastScannedCustomerId}</p> : null}\n</div>\n\n<div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">\n  <h3 className="text-sm font-black text-emerald-700 uppercase tracking-wider">Escanear pase de cliente</h3>\n  <p className="text-xs text-emerald-700/80 mt-1">Aquí se escanea el QR que el cliente guardó en Apple Wallet para contar una visita.</p>\n  <button\n    onClick={() => { setScannerOpen(true); setScannerMsg('Apunta al QR del pase del cliente'); }}\n    className="mt-3 w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-black"\n  >\n    Abrir cámara y escanear pase\n  </button>\n</div>`;
if (s.includes(oldBlock)) s = s.replace(oldBlock, newBlock);

if (!s.includes('{scannerOpen && (')) {
  const marker = "\n{tab === 'redeem' && (";
  const modal = `
{scannerOpen && (
<div className="fixed inset-0 z-[70] bg-black/80 p-4 md:p-8">
  <div className="max-w-xl mx-auto bg-white rounded-3xl p-4 md:p-6 shadow-2xl border border-gray-200">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-black text-gray-900">Escanear pase de cliente</h3>
      <button
        onClick={() => setScannerOpen(false)}
        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold"
      >
        Cerrar
      </button>
    </div>

    <div className="rounded-2xl overflow-hidden border border-gray-200">
      <QRScanner
        constraints={{ facingMode: 'environment' }}
        onScan={(codes: { rawValue: string }[]) => {
          const value = codes?.[0]?.rawValue;
          if (value) void handleAdminScan(value);
        }}
        onError={() => {
          setScannerMsg('No se pudo acceder a la cámara. Revisa permisos del navegador.');
        }}
      />
    </div>
    <p className="mt-3 text-xs font-semibold text-gray-600">Escanea el QR del pase en Apple Wallet para registrar una visita.</p>
    {scannerMsg ? <p className="mt-2 text-sm font-black text-emerald-700">{scannerMsg}</p> : null}
  </div>
</div>
)}

`;
  s = s.replace(marker, modal + marker);
}

fs.writeFileSync(path, s);
console.log('admin/page.tsx actualizado');
NODE

echo "[4/4] Validando lint"
cd web
npx eslint app/api/pass/resolve-token/route.ts app/lib/customer-token.ts
npx eslint app/admin/page.tsx --rule '@typescript-eslint/no-explicit-any: off' --rule '@typescript-eslint/no-unused-vars: off'

echo ""
echo "Listo. Ahora sube cambios con:"
echo "cd ~/workspace"
echo "git checkout -b feat/admin-scan-qr || git checkout feat/admin-scan-qr"
echo "git add web/app/admin/page.tsx web/app/api/pass/resolve-token/route.ts web/app/lib/customer-token.ts web/scripts/replit_apply_admin_scan_flow.sh"
echo "git commit -m 'feat(admin): escanear QR de cliente con cámara y registrar visita'"
echo "git push -u origin feat/admin-scan-qr"
