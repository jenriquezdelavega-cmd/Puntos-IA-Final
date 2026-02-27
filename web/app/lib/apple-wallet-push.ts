import { connect } from 'http2';
import { PrismaClient } from '@prisma/client';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execFileAsync = promisify(execFile);
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

function p12PasswordCandidates(rawPassword: string) {
  const normalized = rawPassword.normalize('NFKC');
  const variants = [rawPassword, rawPassword.trim(), normalized, normalized.trim(), ''];
  const seen = new Set<string>();
  return variants.filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });
}

function getCleanEnv() {
  const env = { ...process.env };
  delete env.LD_LIBRARY_PATH;
  delete env.LD_PRELOAD;
  delete env.DYLD_LIBRARY_PATH;
  delete env.DYLD_INSERT_LIBRARIES;
  return env;
}

async function resolveOpenSslBin(): Promise<string> {
  const preferred = String(process.env.OPENSSL_BIN || '').trim();
  const candidates = [
    preferred.startsWith('/') ? preferred : '',
    '/usr/local/bin/openssl',
    '/usr/bin/openssl',
    '/bin/openssl',
    '/opt/bin/openssl',
    '/var/lang/bin/openssl',
    '/var/task/bin/openssl',
  ].filter(Boolean);

  const env = getCleanEnv();
  for (const bin of candidates) {
    try {
      await execFileAsync(bin, ['version'], { env });
      return bin;
    } catch { /* next */ }
  }
  throw new Error(`openssl not found. Tried: ${candidates.join(', ')}`);
}

async function extractPemFromP12(p12Buffer: Buffer, p12Password: string): Promise<{ cert: string; key: string }> {
  const opensslBin = await resolveOpenSslBin();
  const env = getCleanEnv();
  const tempDir = await mkdtemp(join(tmpdir(), 'apns-'));
  try {
    const p12Path = join(tempDir, 'cert.p12');
    const certPath = join(tempDir, 'cert.pem');
    const keyPath = join(tempDir, 'key.pem');
    await writeFile(p12Path, p12Buffer);

    for (const pw of p12PasswordCandidates(p12Password)) {
      for (const legacy of [[], ['-legacy']]) {
        try {
          await execFileAsync(opensslBin, ['pkcs12', '-in', p12Path, ...legacy, '-out', certPath, '-clcerts', '-nokeys', '-passin', `pass:${pw}`], { env });
          await execFileAsync(opensslBin, ['pkcs12', '-in', p12Path, ...legacy, '-out', keyPath, '-nocerts', '-nodes', '-passin', `pass:${pw}`], { env });
          const cert = await readFile(certPath, 'utf8');
          const key = await readFile(keyPath, 'utf8');
          if (cert && key) return { cert, key };
        } catch { /* try next combination */ }
      }
    }
    throw new Error('Could not extract cert/key from P12 for APNS');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function listWalletPushTokens(prisma: PrismaClient, params: {
  serialNumber: string;
  passTypeIdentifier?: string;
}) {
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

  const p12Password = optionalEnv('APPLE_P12_PASSWORD');
  const host = optionalEnv('APPLE_APNS_HOST') || (optionalEnv('APPLE_APNS_USE_SANDBOX') === 'true' ? 'api.sandbox.push.apple.com' : 'api.push.apple.com');

  const { cert, key } = await extractPemFromP12(decodeP12Base64(p12Base64), p12Password);
  const client = connect(`https://${host}`, { cert, key });

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
