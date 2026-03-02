import { createSign } from 'node:crypto';

const ISSUER_ID_CANDIDATES = [
  'GOOGLE_WALLET_ISSUER_ID',
  'GOOGLE_ISSUER_ID',
  'WALLET_ISSUER_ID',
] as const;

const CLASS_ID_CANDIDATES = [
  'GOOGLE_WALLET_CLASS_ID',
  'GOOGLE_CLASS_ID',
] as const;

const SERVICE_ACCOUNT_CANDIDATES = [
  'GOOGLE_WALLET_SA_B64',
  'GOOGLE_SERVICE_ACCOUNT_B64',
] as const;

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
};

const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';
const WALLET_CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';
const DEFAULT_CLASS_SYNC_TTL_MS = 15 * 60 * 1000;

let lastClassSyncAt = 0;
let inFlightClassSync: Promise<void> | null = null;

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

export function getGoogleWalletClassId() {
  const issuerId = getGoogleWalletIssuerId();
  const classId = firstEnv(CLASS_ID_CANDIDATES);

  if (classId) {
    return classId;
  }

  return issuerId ? `${issuerId}.LOYALTY` : '';
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

export async function getGoogleServiceAccountAccessToken(scopes: string[]) {
  if (!scopes.length) {
    throw new Error('At least one Google OAuth scope is required');
  }

  const credentials = parseGoogleServiceAccount();
  const clientEmail = credentials.client_email || '';
  const privateKey = credentials.private_key || '';
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = credentials.token_uri || GOOGLE_TOKEN_URI;

  const assertion = signSaveToWalletJwt(
    {
      iss: clientEmail,
      sub: clientEmail,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
      scope: scopes.join(' '),
    },
    privateKey,
  );

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const responseBody = (await response.json().catch(() => null)) as { access_token?: string } | null;

  if (!response.ok || !responseBody?.access_token) {
    throw new Error('Unable to obtain Google access token');
  }

  return responseBody.access_token;
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
      'Google Wallet no está configurado. Define GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SA_B64 y (opcional) GOOGLE_WALLET_CLASS_ID en Vercel.',
  };
}

async function parseGoogleWalletApiResponse(response: Response) {
  const responseText = await response.text();
  if (!responseText) return null;

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return { raw: responseText };
  }
}

export function buildGoogleLoyaltyClassPayload() {
  return {
    id: getGoogleWalletClassId(),
    issuerName: 'Punto IA',
    programName: 'Punto IA',
    countryCode: 'MX',
    reviewStatus: 'UNDER_REVIEW',
    textModulesData: [
      {
        id: 'uso',
        header: 'Cómo usar tu pase',
        body: 'Muestra el QR al pagar para registrar tu visita.',
      },
    ],
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['negocio']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['cliente']" }],
                },
              },
            },
          },
          {
            oneItem: {
              item: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['meta-visitas']" }],
                },
              },
            },
          },
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['faltan']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['premio']" }],
                },
              },
            },
          },
        ],
      },
    },
  };
}

export async function upsertGoogleLoyaltyClass() {
  const accessToken = await getGoogleServiceAccountAccessToken(['https://www.googleapis.com/auth/wallet_object.issuer']);
  const payload = buildGoogleLoyaltyClassPayload();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const createResponse = await fetch(WALLET_CLASS_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (createResponse.status === 200 || createResponse.status === 201) {
    return {
      operation: 'created' as const,
      status: createResponse.status,
      body: await parseGoogleWalletApiResponse(createResponse),
      classId: payload.id,
    };
  }

  if (createResponse.status !== 409) {
    return {
      operation: 'failed' as const,
      status: createResponse.status,
      body: await parseGoogleWalletApiResponse(createResponse),
      classId: payload.id,
    };
  }

  const updateResponse = await fetch(`${WALLET_CLASS_URL}/${encodeURIComponent(payload.id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  return {
    operation: updateResponse.ok ? ('updated' as const) : ('failed' as const),
    status: updateResponse.status,
    body: await parseGoogleWalletApiResponse(updateResponse),
    classId: payload.id,
  };
}

export function ensureGoogleLoyaltyClassSynced(options?: { ttlMs?: number }) {
  const ttlMs = Math.max(0, options?.ttlMs ?? DEFAULT_CLASS_SYNC_TTL_MS);
  const now = Date.now();

  if (inFlightClassSync) return inFlightClassSync;
  if (now - lastClassSyncAt < ttlMs) return Promise.resolve();

  inFlightClassSync = (async () => {
    try {
      await upsertGoogleLoyaltyClass();
      lastClassSyncAt = Date.now();
    } finally {
      inFlightClassSync = null;
    }
  })();

  return inFlightClassSync;
}
