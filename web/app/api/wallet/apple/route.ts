import { createHash, randomUUID } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCustomerToken } from '@/app/lib/customer-token';
import { WALLET_PASS_ASSETS } from '@/app/lib/wallet-pass-assets';

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();
const WALLET_ROUTE_VERSION = '2026-02-21.1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENV_ALIASES: Record<string, string[]> = {
  APPLE_PASS_TYPE_ID: ['APPLE_PASS_TYPE_IDENTIFIER', 'NEXT_PUBLIC_APPLE_PASS_TYPE_ID'],
  PUBLIC_BASE_URL: ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_APP_URL'],
};

class MissingEnvVarsError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(`Faltan env vars: ${missing.join(', ')}`);
    this.name = 'MissingEnvVarsError';
    this.missing = missing;
  }
}

function readEnvWithAliases(name: string) {
  const candidates = [name, ...(ENV_ALIASES[name] || [])];
  for (const key of candidates) {
    const value = process.env[key];
    if (value) return value;
  }
  return '';
}

function getRequiredEnvs(names: string[]) {
  const values: Record<string, string> = {};
  const missing: string[] = [];

  for (const name of names) {
    const value = readEnvWithAliases(name);
    if (!value) {
      missing.push(name);
      continue;
    }

    values[name] = value;
  }

  if (missing.length > 0) {
    throw new MissingEnvVarsError(missing);
  }

  return values;
}

function responseHeaders() {
  return { 'x-punto-wallet-version': WALLET_ROUTE_VERSION };
}

function deploymentInfo() {
  return {
    vercelCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    vercelEnv: process.env.VERCEL_ENV || null,
    nodeEnv: process.env.NODE_ENV || null,
  };
}

async function createPassPackage(params: {
  customerId: string;
  businessId: string;
  businessName: string;
}) {
  const {
    APPLE_PASS_TYPE_ID: passTypeIdentifier,
    APPLE_TEAM_ID: teamIdentifier,
    APPLE_P12_PASSWORD: p12Password,
    APPLE_P12_BASE64: p12Base64,
    PUBLIC_BASE_URL,
  } = getRequiredEnvs([
    'APPLE_PASS_TYPE_ID',
    'APPLE_TEAM_ID',
    'APPLE_P12_PASSWORD',
    'APPLE_P12_BASE64',
    'PUBLIC_BASE_URL',
  ]);
  const publicBaseUrl = PUBLIC_BASE_URL.replace(/\/$/, '');

  const qrToken = generateCustomerToken(params.customerId);
  const serialNumber = `${params.customerId}-${params.businessId}`;

  const tempDir = await mkdtemp(join(tmpdir(), 'puntoia-pkpass-'));
  try {
    const p12Path = join(tempDir, 'signer.p12');
    const certPath = join(tempDir, 'signerCert.pem');
    const keyPath = join(tempDir, 'signerKey.pem');
    const chainPath = join(tempDir, 'chain.pem');

    await writeFile(p12Path, Buffer.from(p12Base64, 'base64'));

    await execFileAsync('openssl', [
      'pkcs12',
      '-in',
      p12Path,
      '-clcerts',
      '-nokeys',
      '-out',
      certPath,
      '-passin',
      `pass:${p12Password}`,
    ]);

    await execFileAsync('openssl', [
      'pkcs12',
      '-in',
      p12Path,
      '-nocerts',
      '-nodes',
      '-out',
      keyPath,
      '-passin',
      `pass:${p12Password}`,
    ]);

    // Export all certs from p12 as chain; if user included WWDR chain in p12 this is enough.
    await execFileAsync('openssl', [
      'pkcs12',
      '-in',
      p12Path,
      '-nokeys',
      '-out',
      chainPath,
      '-passin',
      `pass:${p12Password}`,
    ]);

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      teamIdentifier,
      serialNumber,
      organizationName: 'punto IA',
      description: 'Tarjeta de lealtad',
      logoText: 'punto IA',
      foregroundColor: 'rgb(255,255,255)',
      backgroundColor: 'rgb(249,0,134)',
      labelColor: 'rgb(255,199,221)',
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: `${publicBaseUrl}/v/${qrToken}`,
        messageEncoding: 'iso-8859-1',
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: `${publicBaseUrl}/v/${qrToken}`,
          messageEncoding: 'iso-8859-1',
        },
      ],
      storeCard: {
        primaryFields: [{ key: 'visits', label: 'Visitas', value: '0/10' }],
        secondaryFields: [
          { key: 'client', label: 'Cliente', value: params.customerId },
          { key: 'business', label: 'Negocio', value: params.businessName || params.businessId },
        ],
      },
    };

    const passPath = join(tempDir, 'pass.json');
    await writeFile(passPath, JSON.stringify(passJson, null, 2));

    const packageFiles = ['pass.json', 'icon.png', 'logo.png', 'icon@2x.png', 'logo@2x.png'] as const;
    for (const file of packageFiles) {
      const data = file === 'pass.json' ? await readFile(passPath) : WALLET_PASS_ASSETS[file];
      if (!data) continue;
      await writeFile(join(tempDir, file), data);
    }

    const manifest: Record<string, string> = {};
    for (const file of packageFiles) {
      try {
        const data = await readFile(join(tempDir, file));
        manifest[file] = createHash('sha1').update(data).digest('hex');
      } catch {
        // ignore optional files
      }
    }

    const manifestPath = join(tempDir, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    const signaturePath = join(tempDir, 'signature');
    await execFileAsync('openssl', [
      'smime',
      '-binary',
      '-sign',
      '-signer',
      certPath,
      '-inkey',
      keyPath,
      '-certfile',
      chainPath,
      '-in',
      manifestPath,
      '-out',
      signaturePath,
      '-outform',
      'DER',
    ]);

    const zipPath = join(tempDir, `puntoia-${randomUUID()}.pkpass`);
    await execFileAsync('zip', ['-q', '-j', zipPath, 'pass.json', 'manifest.json', 'signature', 'icon.png', 'logo.png', 'icon@2x.png', 'logo@2x.png'], {
      cwd: tempDir,
    });

    return await readFile(zipPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = String(searchParams.get('customerId') || '').trim();
    const businessId = String(searchParams.get('businessId') || '').trim();
    const businessNameInput = String(searchParams.get('businessName') || '').trim();

    if (!customerId) {
      return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    let businessName = businessNameInput || 'Negocio afiliado';
    if (businessId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: businessId }, select: { name: true } });
      if (tenant?.name) businessName = tenant.name;
    }

    const pkpass = await createPassPackage({
      customerId: user.id,
      businessId: businessId || 'coalition',
      businessName,
    });

    return new NextResponse(pkpass, {
      status: 200,
      headers: {
        ...responseHeaders(),
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="puntoia.pkpass"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    if (error instanceof MissingEnvVarsError) {
      return NextResponse.json(
        {
          error: error.message,
          missing: error.missing,
          required: [
            'APPLE_PASS_TYPE_ID',
            'APPLE_TEAM_ID',
            'APPLE_P12_PASSWORD',
            'APPLE_P12_BASE64',
            'PUBLIC_BASE_URL',
          ],
          aliases: ENV_ALIASES,
          deployment: deploymentInfo(),
        },
        { status: 500, headers: responseHeaders() }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo generar el .pkpass', deployment: deploymentInfo() },
      { status: 500, headers: responseHeaders() }
    );
  }
}
