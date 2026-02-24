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

export async function listWalletRegistrationTargets(prisma: PrismaClient, serialNumber: string) {
  await ensureWalletRegistrationsTable(prisma);

  const rows = await prisma.$queryRawUnsafe<Array<{ push_token: string; pass_type_identifier: string }>>(
    `
      SELECT DISTINCT push_token, pass_type_identifier
      FROM ${TABLE_NAME}
      WHERE serial_number = $1
    `,
    serialNumber
  );

  return rows
    .map((row) => ({
      pushToken: String(row.push_token || '').trim(),
      passTypeIdentifier: String(row.pass_type_identifier || '').trim(),
    }))
    .filter((row) => row.pushToken && row.passTypeIdentifier);
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

function apnsHosts() {
  const forced = optionalEnv('APPLE_APNS_HOST');
  if (forced) return [forced];

  const preferSandbox = optionalEnv('APPLE_APNS_USE_SANDBOX') === 'true';
  return preferSandbox
    ? ['api.sandbox.push.apple.com', 'api.push.apple.com']
    : ['api.push.apple.com', 'api.sandbox.push.apple.com'];
}

async function sendPushToHost(host: string, pushToken: string, passTypeIdentifier: string) {
  const client = connect(`https://${host}`, {
    pfx: decodeP12Base64(optionalEnv('APPLE_P12_BASE64')),
    passphrase: optionalEnv('APPLE_P12_PASSWORD') || undefined,
  });

  try {
    const result = await new Promise<{ ok: boolean; status: number; reason?: string; host: string }>((resolve, reject) => {
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
          resolve({ ok: true, status, host });
          return;
        }

        let reason = '';
        try {
          const parsed = JSON.parse(body) as { reason?: string };
          reason = String(parsed.reason || '').trim();
        } catch {
          reason = body.trim();
        }

        resolve({ ok: false, status, reason, host });
      });

      req.end('{}');
    });

    return result;
  } finally {
    client.close();
  }
}

export async function pushWalletUpdateToDevice(pushToken: string, passTypeIdentifier: string) {
  const p12Base64 = optionalEnv('APPLE_P12_BASE64');
  if (!p12Base64) return { ok: false as const, status: 0, reason: 'APPLE_P12_BASE64 no configurado', host: '' };

  let lastResult: { ok: boolean; status: number; reason?: string; host: string } = { ok: false, status: 0, reason: 'No APNS host', host: '' };

  for (const host of apnsHosts()) {
    lastResult = await sendPushToHost(host, pushToken, passTypeIdentifier);
    if (lastResult.ok) return lastResult;

    if (lastResult.reason && !lastResult.reason.includes('BadCertificateEnvironment')) {
      return lastResult;
    }
  }

  return lastResult;
}
