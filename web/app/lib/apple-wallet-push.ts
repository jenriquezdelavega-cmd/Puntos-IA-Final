import { connect } from 'http2';
import { PrismaClient } from '@prisma/client';
import { ensureWalletRegistrationsTable } from '@/app/lib/apple-wallet-webservice';

const TABLE_NAME = 'apple_wallet_registrations';

function decodeP12Base64(raw: string) {
  const value = String(raw || '').trim();
  if (!value) throw new Error('APPLE_P12_BASE64 no configurado');
  return Buffer.from(value.replace(/\s+/g, ''), 'base64');
}

function optionalEnv(name: string) {
  const value = process.env[name];
  if (value == null) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export async function listWalletPushTokens(prisma: PrismaClient, params: {
  serialNumber: string;
  passTypeIdentifier?: string;
}) {
  await ensureWalletRegistrationsTable(prisma);

  const rows = params.passTypeIdentifier
    ? await prisma.$queryRawUnsafe<Array<{ push_token: string }>>(
      `
        SELECT DISTINCT push_token
        FROM ${TABLE_NAME}
        WHERE serial_number = $1
          AND pass_type_identifier = $2
      `,
      params.serialNumber,
      params.passTypeIdentifier
    )
    : await prisma.$queryRawUnsafe<Array<{ push_token: string }>>(
      `
        SELECT DISTINCT push_token
        FROM ${TABLE_NAME}
        WHERE serial_number = $1
      `,
      params.serialNumber
    );

  return rows
    .map((row) => String(row.push_token || '').trim())
    .filter(Boolean);
}

export async function deleteWalletRegistrationsByPushToken(prisma: PrismaClient, pushToken: string) {
  await ensureWalletRegistrationsTable(prisma);

  await prisma.$executeRawUnsafe(
    `
      DELETE FROM ${TABLE_NAME}
      WHERE push_token = $1
    `,
    pushToken
  );
}

export async function pushWalletUpdateToDevice(pushToken: string, passTypeIdentifier: string) {
  const p12Base64 = optionalEnv('APPLE_P12_BASE64');
  if (!p12Base64) return { ok: false as const, status: 0, reason: 'APPLE_P12_BASE64 no configurado' };

  const host = optionalEnv('APPLE_APNS_HOST') || (optionalEnv('APPLE_APNS_USE_SANDBOX') === 'true' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com');
  const client = connect(`https://${host}`, {
    pfx: decodeP12Base64(p12Base64),
    passphrase: optionalEnv('APPLE_P12_PASSWORD') || undefined,
  });

  try {
    const result = await new Promise<{ ok: boolean; status: number; reason?: string }>((resolve, reject) => {
      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${pushToken}`,
        'apns-topic': passTypeIdentifier,
        'apns-priority': '5',
        'apns-push-type': 'background',
        'content-type': 'application/json',
      });

      let status = 0;
      let body = '';

      req.on('response', (headers) => {
        status = Number(headers[':status'] || 0);
      });
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.close();
        reject(new Error('APNS timeout'));
      });
      req.on('end', () => {
        if (status >= 200 && status < 300) {
          resolve({ ok: true, status });
          return;
        }

        let reason = '';
        try {
          const parsed = JSON.parse(body) as { reason?: string };
          reason = String(parsed.reason || '').trim();
        } catch {
          reason = body.trim();
        }

        resolve({ ok: false, status, reason });
      });

      req.end('{}');
    });

    return result;
  } finally {
    client.close();
  }
}
