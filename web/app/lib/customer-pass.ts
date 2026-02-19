import { createHmac, timingSafeEqual } from 'crypto';

export type CustomerPassPayload = {
  cid: string;
  iat: number;
  v: 1;
};

export type CustomerPassData = {
  customerId: string;
  token: string;
  qrValue: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getPassSecret() {
  return process.env.PASS_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'dev-pass-secret-change-me';
}

function signPart(part: string) {
  return createHmac('sha256', getPassSecret()).update(part).digest('base64url');
}

export function generateCustomerPass(customerId: string): CustomerPassData {
  const cleanCustomerId = String(customerId || '').trim();
  if (!cleanCustomerId) {
    throw new Error('customer_id requerido');
  }

  const payload: CustomerPassPayload = {
    cid: cleanCustomerId,
    iat: Math.floor(Date.now() / 1000),
    v: 1,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPart(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  return {
    customerId: cleanCustomerId,
    token,
    qrValue: token,
  };
}

export function verifyCustomerPassToken(token: string): CustomerPassPayload | null {
  try {
    const [encodedPayload, signature] = String(token || '').split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = signPart(encodedPayload);
    const given = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<CustomerPassPayload>;
    if (!payload?.cid || payload.v !== 1) return null;

    return {
      cid: String(payload.cid),
      iat: Number(payload.iat || 0),
      v: 1,
    };
  } catch {
    return null;
  }
}
