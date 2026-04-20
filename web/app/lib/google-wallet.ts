import { createHash, createSign } from 'node:crypto';

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
const WALLET_OBJECT_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject';
const DEFAULT_CLASS_SYNC_TTL_MS = 15 * 60 * 1000;
const TENANT_CLASS_SCHEMA_VERSION = 'v6';
export const GOOGLE_WALLET_PROGRAM_NAME_HIDDEN = '\u200B';

const classSyncState = new Map<string, {
  lastSyncAt: number;
  inFlight: Promise<void> | null;
  lastPayloadFingerprint: string;
}>();

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

function sanitizeClassIdPart(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '_')
    .slice(0, 58);
}

function buildTenantClassSuffix(tenantId: string) {
  const normalizedTenantId = sanitizeClassIdPart(tenantId);
  if (!normalizedTenantId) return '';

  const tenantHash = createHash('sha256').update(tenantId).digest('hex').slice(0, 12);
  const tenantLabel = normalizedTenantId.slice(0, 24);
  return `tenant_${tenantLabel}_${tenantHash}_${TENANT_CLASS_SCHEMA_VERSION}`;
}

export function getGoogleWalletClassIdForTenant(tenantId: string) {
  const issuerId = getGoogleWalletIssuerId();
  if (!issuerId) return '';

  const tenantSuffix = buildTenantClassSuffix(tenantId);
  if (!tenantSuffix) {
    return getGoogleWalletClassId();
  }

  const baseClassId = firstEnv(CLASS_ID_CANDIDATES);

  if (baseClassId) {
    const rawBase = baseClassId.includes('.') ? baseClassId.split('.').slice(1).join('.') : baseClassId;
    const normalizedBase = sanitizeClassIdPart(rawBase || 'loyalty').slice(0, 16);
    return `${issuerId}.${normalizedBase}_${tenantSuffix}`;
  }

  return `${issuerId}.${tenantSuffix}`;
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

export function buildGoogleLoyaltyClassPayload(params?: {
  classId?: string;
  issuerName?: string;
  programName?: string;
  logoUri?: string;
  programColor?: string;
}) {
  const classId = params?.classId || getGoogleWalletClassId();
  const issuerName = params?.issuerName || 'Punto IA';
  const programName = params?.programName || GOOGLE_WALLET_PROGRAM_NAME_HIDDEN;

  return {
    id: classId,
    issuerName,
    programName,
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
            oneItem: {
              item: {
                firstValue: {
                  fields: [{ fieldPath: "object.imageModulesData['hero']" }],
                },
              },
            },
          },
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: 'object.accountName' }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['periodo']" }],
                },
              },
            },
          },
          {
            twoItems: {
              startItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['meta-visitas']" }],
                },
              },
              endItem: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['faltan']" }],
                },
              },
            },
          },
          {
            oneItem: {
              item: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['premio']" }],
                },
              },
            },
          },
          {
            oneItem: {
              item: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['sellos']" }],
                },
              },
            },
          },
          {
            oneItem: {
              item: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['coalicion']" }],
                },
              },
            },
          },
        ],
      },
    },
    ...(params?.logoUri
      ? {
          programLogo: {
            sourceUri: {
              uri: params.logoUri,
            },
            contentDescription: {
              defaultValue: {
                language: 'es-MX',
                value: `Logo de ${programName}`,
              },
            },
          },
        }
      : {}),
    ...(params?.programColor ? { hexBackgroundColor: params.programColor } : {}),
  };
}

function buildGoogleLoyaltyClassPatchPayload(params?: {
  issuerName?: string;
  programName?: string;
  logoUri?: string;
  programColor?: string;
}) {
  const fullPayload = buildGoogleLoyaltyClassPayload(params);

  return {
    issuerName: fullPayload.issuerName,
    programName: fullPayload.programName,
    reviewStatus: 'UNDER_REVIEW',
    textModulesData: fullPayload.textModulesData,
    classTemplateInfo: fullPayload.classTemplateInfo,
    ...(fullPayload.programLogo ? { programLogo: fullPayload.programLogo } : {}),
    ...(fullPayload.hexBackgroundColor ? { hexBackgroundColor: fullPayload.hexBackgroundColor } : {}),
  };
}

export async function upsertGoogleLoyaltyClass(params?: {
  classId?: string;
  issuerName?: string;
  programName?: string;
  logoUri?: string;
  programColor?: string;
}) {
  const accessToken = await getGoogleServiceAccountAccessToken(['https://www.googleapis.com/auth/wallet_object.issuer']);
  const payload = buildGoogleLoyaltyClassPayload(params);
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

  const updatePayload = buildGoogleLoyaltyClassPatchPayload(params);

  const updateResponse = await fetch(`${WALLET_CLASS_URL}/${encodeURIComponent(payload.id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updatePayload),
  });

  return {
    operation: updateResponse.ok ? ('updated' as const) : ('failed' as const),
    status: updateResponse.status,
    body: await parseGoogleWalletApiResponse(updateResponse),
    classId: payload.id,
  };
}

export async function upsertGoogleLoyaltyObject(payload: Record<string, unknown>) {
  const objectId = String(payload.id || '').trim();

  if (!objectId) {
    throw new Error('Google loyalty object payload requires id');
  }

  const accessToken = await getGoogleServiceAccountAccessToken(['https://www.googleapis.com/auth/wallet_object.issuer']);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const createResponse = await fetch(WALLET_OBJECT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (createResponse.status === 200 || createResponse.status === 201) {
    return {
      operation: 'created' as const,
      status: createResponse.status,
      body: await parseGoogleWalletApiResponse(createResponse),
      objectId,
    };
  }

  if (createResponse.status !== 409) {
    return {
      operation: 'failed' as const,
      status: createResponse.status,
      body: await parseGoogleWalletApiResponse(createResponse),
      objectId,
    };
  }

  const updatePayload = {
    state: payload.state,
    accountName: payload.accountName,
    barcode: payload.barcode,
    loyaltyPoints: payload.loyaltyPoints,
    textModulesData: payload.textModulesData,
    imageModulesData: payload.imageModulesData,
    hexBackgroundColor: payload.hexBackgroundColor,
    cardTitle: payload.cardTitle,
    logo: payload.logo,
  };

  const updateResponse = await fetch(`${WALLET_OBJECT_URL}/${encodeURIComponent(objectId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updatePayload),
  });

  if (!updateResponse.ok) {
    const replacePayload = {
      ...payload,
    };
    delete replacePayload.id;

    const replaceResponse = await fetch(`${WALLET_OBJECT_URL}/${encodeURIComponent(objectId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(replacePayload),
    });

    return {
      operation: replaceResponse.ok ? ('updated' as const) : ('failed' as const),
      status: replaceResponse.status,
      body: await parseGoogleWalletApiResponse(replaceResponse),
      objectId,
    };
  }

  return {
    operation: updateResponse.ok ? ('updated' as const) : ('failed' as const),
    status: updateResponse.status,
    body: await parseGoogleWalletApiResponse(updateResponse),
    objectId,
  };
}

export async function addGoogleLoyaltyObjectMessage(params: {
  objectId: string;
  header: string;
  body: string;
  messageId?: string;
}) {
  const objectId = String(params.objectId || '').trim();
  if (!objectId) {
    throw new Error('Google loyalty object message requires objectId');
  }

  const accessToken = await getGoogleServiceAccountAccessToken(['https://www.googleapis.com/auth/wallet_object.issuer']);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const requestUrl = `${WALLET_OBJECT_URL}/${encodeURIComponent(objectId)}/addMessage`;
  const messageId = String(params.messageId || '').trim() || `msg_${Date.now()}`;

  const payloadVariants = [
    {
      message: {
        id: messageId,
        header: String(params.header || '').trim(),
        body: String(params.body || '').trim(),
        messageType: 'TEXT_AND_NOTIFY',
      },
    },
    {
      message: {
        id: messageId,
        header: String(params.header || '').trim(),
        body: String(params.body || '').trim(),
        message_type: 'TEXT_AND_NOTIFY',
      },
    },
  ];

  let lastResponse: { ok: boolean; status: number; body: unknown } | null = null;

  for (const payload of payloadVariants) {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const parsedBody = await parseGoogleWalletApiResponse(response);
    lastResponse = { ok: response.ok, status: response.status, body: parsedBody };
    if (response.ok) return lastResponse;
  }

  return lastResponse || { ok: false, status: 0, body: { error: 'Unknown Google Wallet message error' } };
}

export function ensureGoogleLoyaltyClassSynced(options?: {
  ttlMs?: number;
  classId?: string;
  issuerName?: string;
  programName?: string;
  logoUri?: string;
  programColor?: string;
}) {
  const classId = options?.classId || getGoogleWalletClassId();
  if (!classId) return Promise.resolve();

  const ttlMs = Math.max(0, options?.ttlMs ?? DEFAULT_CLASS_SYNC_TTL_MS);
  const now = Date.now();
  const payloadFingerprint = JSON.stringify({
    issuerName: options?.issuerName || '',
    programName: options?.programName || '',
    logoUri: options?.logoUri || '',
    programColor: options?.programColor || '',
  });
  const currentState = classSyncState.get(classId) || {
    lastSyncAt: 0,
    inFlight: null,
    lastPayloadFingerprint: '',
  };
  const payloadChanged = currentState.lastPayloadFingerprint !== payloadFingerprint;

  if (currentState.inFlight) return currentState.inFlight;
  if (!payloadChanged && (now - currentState.lastSyncAt < ttlMs)) return Promise.resolve();

  const nextInFlight = (async () => {
    try {
      const result = await upsertGoogleLoyaltyClass(options);

      if (result.operation === 'failed') {
        const details = result.body ? `: ${JSON.stringify(result.body)}` : '';
        throw new Error(`Unable to sync Google Wallet class ${classId} (status ${result.status})${details}`);
      }

      classSyncState.set(classId, {
        lastSyncAt: Date.now(),
        inFlight: null,
        lastPayloadFingerprint: payloadFingerprint,
      });
    } finally {
      const latestState = classSyncState.get(classId) || {
        lastSyncAt: 0,
        inFlight: null,
        lastPayloadFingerprint: payloadFingerprint,
      };
      classSyncState.set(classId, {
        lastSyncAt: latestState.lastSyncAt,
        inFlight: null,
        lastPayloadFingerprint: latestState.lastPayloadFingerprint || payloadFingerprint,
      });
    }
  })();

  classSyncState.set(classId, {
    lastSyncAt: currentState.lastSyncAt,
    inFlight: nextInFlight,
    lastPayloadFingerprint: payloadFingerprint,
  });
  return nextInFlight;
}
