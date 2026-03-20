import crypto from 'crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

export type TenantSessionPayload = {
  tuid: string;
  tid: string;
  role: string;
  exp: number;
  v: 1;
};

function getSecret(): string {
  const explicit = String(process.env.TENANT_SESSION_SECRET || '').trim();
  if (explicit) return explicit;

  const shared = String(process.env.USER_SESSION_SECRET || process.env.QR_TOKEN_SECRET || '').trim();
  if (shared) return shared;

  throw new Error('TENANT_SESSION_SECRET o USER_SESSION_SECRET o QR_TOKEN_SECRET requerido');
}

function sign(encodedPayload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function generateTenantSessionToken(input: { tenantUserId: string; tenantId: string; role: string }): string {
  const payload: TenantSessionPayload = {
    tuid: String(input.tenantUserId || '').trim(),
    tid: String(input.tenantId || '').trim(),
    role: String(input.role || '').trim(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    v: 1,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encodedPayload, getSecret());
  return `${encodedPayload}.${signature}`;
}

export function verifyTenantSessionToken(token: string): TenantSessionPayload {
  const raw = String(token || '').trim();
  if (!raw) throw new Error('tenantSessionToken requerido');

  const [encodedPayload, signature] = raw.split('.');
  if (!encodedPayload || !signature) throw new Error('tenantSessionToken inválido');

  const expectedSignature = sign(encodedPayload, getSecret());
  const got = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) {
    throw new Error('tenantSessionToken inválido');
  }

  let parsed: TenantSessionPayload;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TenantSessionPayload;
  } catch {
    throw new Error('tenantSessionToken inválido');
  }

  if (!parsed?.tuid || !parsed?.tid || !parsed?.role || parsed?.v !== 1) {
    throw new Error('tenantSessionToken inválido');
  }

  if (!Number.isFinite(parsed.exp) || Math.floor(Date.now() / 1000) > parsed.exp) {
    throw new Error('tenantSessionToken expirado');
  }

  return parsed;
}
