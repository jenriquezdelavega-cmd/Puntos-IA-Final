import crypto from 'crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

export type UserSessionPayload = {
  uid: string;
  phone: string;
  exp: number;
  v: 1;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getSessionSecret(): string {
  const explicit = String(process.env.USER_SESSION_SECRET || '').trim();
  if (explicit) return explicit;

  const shared = String(process.env.QR_TOKEN_SECRET || '').trim();
  if (shared) return shared;

  throw new Error('USER_SESSION_SECRET o QR_TOKEN_SECRET requerido');
}

function signPayload(encodedPayload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function generateUserSessionToken(input: { uid: string; phone: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: UserSessionPayload = {
    uid: String(input.uid || '').trim(),
    phone: String(input.phone || '').trim(),
    exp: now + SESSION_TTL_SECONDS,
    v: 1,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, getSessionSecret());
  return `${encodedPayload}.${signature}`;
}

export function verifyUserSessionToken(token: string): UserSessionPayload {
  const raw = String(token || '').trim();
  if (!raw) throw new Error('sessionToken requerido');

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) throw new Error('sessionToken inválido');

  const expectedSignature = signPayload(encodedPayload, getSessionSecret());
  const got = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) {
    throw new Error('sessionToken inválido');
  }

  let parsed: UserSessionPayload;
  try {
    parsed = JSON.parse(base64UrlDecode(encodedPayload)) as UserSessionPayload;
  } catch {
    throw new Error('sessionToken inválido');
  }

  if (!parsed?.uid || !parsed?.phone || parsed?.v !== 1) {
    throw new Error('sessionToken inválido');
  }

  const now = Math.floor(Date.now() / 1000);
  if (!parsed.exp || now > parsed.exp) {
    throw new Error('sessionToken expirado');
  }

  return parsed;
}
