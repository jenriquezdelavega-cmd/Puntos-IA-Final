import { createHmac, timingSafeEqual } from 'crypto';
import { appendFileSync } from 'node:fs';

export type CustomerQrPayload = {
  cid: string;
  iat: number;
  v: 1;
};

function getCustomerQrSecret() {
  return (
    process.env.QR_TOKEN_SECRET
    || process.env.PASS_TOKEN_SECRET
    || process.env.NEXTAUTH_SECRET
    || process.env.JWT_SECRET
    || 'dev-pass-secret-change-me'
  );
}

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
  const secret = getCustomerQrSecret();

  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyCustomerToken(token: string): CustomerQrPayload {
  const raw = String(token || '').trim();
  if (!raw) throw new Error('token requerido');
  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', JSON.stringify({
    hypothesisId: 'H2',
    location: 'web/app/lib/customer-token.ts:37',
    message: 'verifyCustomerToken received token',
    data: { rawLength: raw.length, hasDot: raw.includes('.') },
    timestamp: Date.now(),
  }) + '\n');
  // #endregion

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) throw new Error('token inválido');

  const secret = getCustomerQrSecret();

  const expectedSignature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', JSON.stringify({
    hypothesisId: 'H1',
    location: 'web/app/lib/customer-token.ts:54',
    message: 'verifyCustomerToken comparing signatures',
    data: { providedLength: provided.length, expectedLength: expected.length, hasQrSecret: Boolean(secret) },
    timestamp: Date.now(),
  }) + '\n');
  // #endregion
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error('token inválido');
  }

  const decodedPayload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
  const parsed = JSON.parse(decodedPayload) as CustomerQrPayload;
  if (!parsed?.cid || parsed?.v !== 1) throw new Error('token inválido');
  // #region agent log
  appendFileSync('/opt/cursor/logs/debug.log', JSON.stringify({
    hypothesisId: 'H4',
    location: 'web/app/lib/customer-token.ts:68',
    message: 'verifyCustomerToken parsed payload',
    data: { cid: parsed.cid, version: parsed.v },
    timestamp: Date.now(),
  }) + '\n');
  // #endregion
  return parsed;
}
