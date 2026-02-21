import { createHash, randomUUID } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCustomerToken } from '@/app/lib/customer-token';

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta env var: ${name}`);
  return value;
}

function readCustomerId(searchParams: URLSearchParams) {
  const direct = String(searchParams.get('customerId') || '').trim();
  if (direct) return direct;
  // Compatibilidad con enlaces existentes en frontend (`customer_id`).
  return String(searchParams.get('customer_id') || '').trim();
}

async function createPassPackage(params: {
  customerId: string;
  businessId: string;
  businessName: string;
}) {
  const passTypeIdentifier = requiredEnv('APPLE_PASS_TYPE_ID');
  const teamIdentifier = requiredEnv('APPLE_TEAM_ID');
  const p12Password = requiredEnv('APPLE_P12_PASSWORD');
  const p12Base64 = requiredEnv('APPLE_P12_BASE64');
  const publicBaseUrl = requiredEnv('PUBLIC_BASE_URL').replace(/\/$/, '');

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

    const assetsDir = join(process.cwd(), 'wallet-assets');
    const requiredFiles = ['icon.png', 'logo.png'];
    for (const name of requiredFiles) {
      await readFile(join(assetsDir, name));
    }

    const passPath = join(tempDir, 'pass.json');
    await writeFile(passPath, JSON.stringify(passJson, null, 2));

    const packageFiles = ['pass.json', 'icon.png', 'logo.png', 'icon@2x.png', 'logo@2x.png'] as const;
    for (const file of packageFiles) {
      const source = file === 'pass.json' ? passPath : join(assetsDir, file);
      try {
        const data = await readFile(source);
        await writeFile(join(tempDir, file), data);
      } catch {
        // optional retina assets can be absent
      }
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
    const customerId = readCustomerId(searchParams);
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
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="puntoia.pkpass"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo generar el .pkpass';
    const status = message.startsWith('Falta env var:') ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
