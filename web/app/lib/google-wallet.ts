import { createSign } from 'node:crypto';

const ISSUER_ID_CANDIDATES = [
  'GOOGLE_WALLET_ISSUER_ID',
  'GOOGLE_ISSUER_ID',
  'WALLET_ISSUER_ID',
] as const;

const SERVICE_ACCOUNT_CANDIDATES = [
  'GOOGLE_WALLET_SA_B64',
  'GOOGLE_SERVICE_ACCOUNT_B64',
] as const;

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
};

function firstEnv(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value?.trim()) return value.trim();
  }
  return '';
}

export function getGoogleWalletIssuerId() {
  return firstEnv(ISSUER_ID_CANDIDATES);
}

export function parseGoogleServiceAccount() {
  const encoded = firstEnv(SERVICE_ACCOUNT_CANDIDATES);

  if (!encoded) {
    throw new Error('Missing GOOGLE_WALLET_SA_B64 env var (or GOOGLE_SERVICE_ACCOUNT_B64)');
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');

  try {
    const parsed = JSON.parse(decoded) as ServiceAccount;

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('Service account JSON is missing client_email/private_key');
    }

    return parsed;
  } catch {
    throw new Error('Invalid GOOGLE_WALLET_SA_B64 content. Expected base64-encoded service account JSON.');
  }
}

function base64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signSaveToWalletJwt(payload: Record<string, unknown>, privateKey: string) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const input = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(input);
  signer.end();

  const signature = signer.sign(privateKey);
  return `${input}.${base64url(signature)}`;
}

export function googleWalletConfigErrorResponse() {
  return {
    error:
      'Google Wallet no está configurado. Define GOOGLE_WALLET_ISSUER_ID y GOOGLE_WALLET_SA_B64 en Vercel.',
  };
}
