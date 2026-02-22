import { createHash } from 'crypto';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCustomerToken } from '@/app/lib/customer-token';
import { walletAuthTokenForSerial, walletSerialNumber } from '@/app/lib/apple-wallet-webservice';

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();
let cachedOpenSslBin: string | null = null;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


function getOpenSslEnv() {
  const env = { ...process.env };
  delete env.LD_LIBRARY_PATH;
  delete env.LD_PRELOAD;
  delete env.DYLD_LIBRARY_PATH;
  delete env.DYLD_INSERT_LIBRARIES;
  return env;
}


function pkcs12ArgVariants(baseArgs: string[]) {
  return [baseArgs, ['-legacy', ...baseArgs]];
}

function p12PasswordCandidates(rawPassword: string) {
  const normalized = rawPassword.normalize('NFKC');
  const variants = [
    rawPassword,
    rawPassword.trim(),
    normalized,
    normalized.trim(),
    normalized.replace(/[\u200B-\u200D\uFEFF]/g, ''),
  ];

  const unquoted = rawPassword.trim().replace(/^(?:["'])(.*)(?:["'])$/, '$1');
  variants.push(unquoted);
  variants.push('');

  const seen = new Set<string>();
  return variants.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function decodeP12Base64(rawBase64: string) {
  const withoutDataPrefix = rawBase64.replace(/^data:[^,]+,/, '').trim();
  const normalizedBase64 = withoutDataPrefix
    .replace(/^(?:["'])(.*)(?:["'])$/, '$1')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const decoded = Buffer.from(normalizedBase64, 'base64');
  if (!decoded.length) {
    throw new Error('APPLE_P12_BASE64 está vacío o no es base64 válido.');
  }

  // PKCS#12 is ASN.1 DER and should start with a SEQUENCE tag (0x30).
  if (decoded[0] !== 0x30) {
    throw new Error(
      'APPLE_P12_BASE64 no parece un .p12 válido (formato inesperado al decodificar).'
    );
  }

  return decoded;
}

async function exportPkcs12(
  p12Path: string,
  outputPath: string,
  p12Password: string,
  args: string[]
) {
  let lastError: unknown = null;

  for (const candidatePassword of p12PasswordCandidates(p12Password)) {
    for (const variantArgs of pkcs12ArgVariants(args)) {
      try {
        await runOpenSsl([
          'pkcs12',
          '-in',
          p12Path,
          ...variantArgs,
          '-out',
          outputPath,
          '-passin',
          `pass:${candidatePassword}`,
        ]);
        return;
      } catch (error) {
        lastError = error;
      }
    }
  }

  const baseMessage =
    lastError instanceof Error ? lastError.message : 'No se pudo leer el certificado .p12';
  throw new Error(
    `${baseMessage}
Verifica APPLE_P12_PASSWORD (sin espacios/quotes extra), que APPLE_P12_BASE64 corresponda al mismo .p12 y que no esté entre comillas ni con \\n literales. Si el .p12 fue exportado sin password, deja APPLE_P12_PASSWORD vacío.`
  );
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta env var: ${name}`);
  return value;
}

function optionalEnv(name: string, fallback = '') {
  const value = process.env[name];
  return value == null ? fallback : String(value);
}

function readCustomerId(searchParams: URLSearchParams) {
  const direct = String(searchParams.get('customerId') || '').trim();
  if (direct) return direct;
  // Compatibilidad con enlaces existentes en frontend (`customer_id`).
  return String(searchParams.get('customer_id') || '').trim();
}

async function resolveOpenSslBin() {
  if (cachedOpenSslBin) return cachedOpenSslBin;

  const preferredRaw = String(process.env.OPENSSL_BIN || '').trim();
  const preferred = preferredRaw.startsWith('/') ? preferredRaw : '';
  const candidates = [
    preferred,
    '/usr/local/bin/openssl',
    '/usr/bin/openssl',
    '/bin/openssl',
    '/opt/bin/openssl',
    '/var/lang/bin/openssl',
    '/var/task/bin/openssl',
  ].filter(Boolean);

  const attempted: string[] = [];
  for (const candidate of candidates) {
    attempted.push(candidate);
    try {
      await execFileAsync(candidate, ['version'], { env: getOpenSslEnv() });
      cachedOpenSslBin = candidate;
      return candidate;
    } catch {
      // try next candidate
    }
  }

  const badPreferred = preferredRaw && !preferredRaw.startsWith('/');
  throw new Error(
    `No se encontró un binario OpenSSL funcional en rutas absolutas. Candidatos probados: ${attempted.join(', ')}.` +
      (badPreferred
        ? ` OPENSSL_BIN actual es inválido (${preferredRaw}); debe ser ruta absoluta.`
        : '') +
      ' Configura OPENSSL_BIN con una ruta absoluta (ej: /usr/bin/openssl).'
  );
}

async function runOpenSsl(args: string[]) {
  const env = getOpenSslEnv();
  const opensslBin = await resolveOpenSslBin();

  try {
    return await execFileAsync(opensslBin, args, { env });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('SSL_get_srp_g')) throw error;

    const fallbackBins = ['/usr/bin/openssl', '/usr/local/bin/openssl', '/bin/openssl'];
    for (const bin of fallbackBins) {
      if (bin === opensslBin) continue;
      try {
        await execFileAsync(bin, ['version'], { env });
        cachedOpenSslBin = bin;
        return await execFileAsync(bin, args, { env });
      } catch {
        // keep trying
      }
    }

    throw new Error(
      `${message}
Forza OPENSSL_BIN con ruta absoluta en Vercel/Replit (recomendado: /usr/bin/openssl).`
    );
  }
}


function createCrc32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crc32Table = createCrc32Table();

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const value of data) {
    crc = crc32Table[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(entries: Array<{ name: string; data: Buffer }>) {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, 'utf8');
    const fileData = entry.data;
    const checksum = crc32(fileData);

    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(fileData.length, 18);
    localHeader.writeUInt32LE(fileData.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuffer.copy(localHeader, 30);

    localChunks.push(localHeader, fileData);

    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(fileData.length, 20);
    centralHeader.writeUInt32LE(fileData.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuffer.copy(centralHeader, 46);

    centralChunks.push(centralHeader);

    offset += localHeader.length + fileData.length;
  }

  const centralDirectory = Buffer.concat(centralChunks);
  const localDirectory = Buffer.concat(localChunks);

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localDirectory.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, endRecord]);
}


function buildPkPassArchiveEntries() {
  const required = ['pass.json', 'manifest.json', 'signature', 'icon.png', 'logo.png'] as const;
  const optional = ['icon@2x.png', 'logo@2x.png'] as const;
  return { required, optional };
}

function decodeTenantLogoData(logoData: string) {
  const raw = String(logoData || '').trim();
  if (!raw) return null;

  const dataUrlMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return Buffer.from(dataUrlMatch[2], 'base64');
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) return null;

  try {
    const compact = raw.replace(/\s+/g, '');
    return Buffer.from(compact, 'base64');
  } catch {
    return null;
  }
}

async function createPassPackage(params: {
  customerId: string;
  businessId: string;
  businessName: string;
  requiredVisits: number;
  currentVisits: number;
  tenantLogoData?: string | null;
}) {
  const passTypeIdentifier = requiredEnv('APPLE_PASS_TYPE_ID');
  const teamIdentifier = requiredEnv('APPLE_TEAM_ID');
  const p12Password = optionalEnv('APPLE_P12_PASSWORD');
  const p12Base64 = requiredEnv('APPLE_P12_BASE64');
  const publicBaseUrl = requiredEnv('PUBLIC_BASE_URL').replace(/\/$/, '');

  const qrToken = generateCustomerToken(params.customerId);
  const serialNumber = walletSerialNumber(params.customerId, params.businessId);
  const authenticationToken = walletAuthTokenForSerial(serialNumber);

  const tempDir = await mkdtemp(join(tmpdir(), 'puntoia-pkpass-'));
  try {
    const p12Path = join(tempDir, 'signer.p12');
    const certPath = join(tempDir, 'signerCert.pem');
    const keyPath = join(tempDir, 'signerKey.pem');
    const chainPath = join(tempDir, 'chain.pem');

    await writeFile(p12Path, decodeP12Base64(p12Base64));

    await exportPkcs12(p12Path, certPath, p12Password, ['-clcerts', '-nokeys']);

    await exportPkcs12(p12Path, keyPath, p12Password, ['-nocerts', '-nodes']);

    // Export all certs from p12 as chain; if user included WWDR chain in p12 this is enough.
    await exportPkcs12(p12Path, chainPath, p12Password, ['-nokeys']);

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier,
      teamIdentifier,
      serialNumber,
      organizationName: params.businessName || 'Negocio afiliado',
      description: `Tarjeta de lealtad · ${params.businessName || 'Negocio afiliado'}`,
      logoText: params.businessName || 'Negocio afiliado',
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
      webServiceURL: `${publicBaseUrl}/api/wallet/apple/v1`,
      authenticationToken,
      storeCard: {
        headerFields: [
          { key: 'business', label: 'Negocio', value: params.businessName || params.businessId },
        ],
        primaryFields: [{ key: 'visits', label: 'Contador de visitas', value: `${params.currentVisits}/${params.requiredVisits}` }],
        secondaryFields: [
          { key: 'client', label: 'Cliente', value: params.customerId },
        ],
        auxiliaryFields: [
          { key: 'brand', label: 'Branding', value: 'Punto IA' },
        ],
        backFields: [
          { key: 'footbrand', label: 'Punto IA', value: 'Programa de lealtad' },
        ],
      },
    };

    const assetsDir = join(process.cwd(), 'wallet-assets');
    const requiredFiles = ['icon.png', 'logo.png'];
    for (const name of requiredFiles) {
      await readFile(join(assetsDir, name));
    }

    const tenantLogo = decodeTenantLogoData(String(params.tenantLogoData || ''));
    if (tenantLogo && tenantLogo.length > 0) {
      await writeFile(join(tempDir, 'logo.png'), tenantLogo);
      await writeFile(join(tempDir, 'logo@2x.png'), tenantLogo);
    }

    const passPath = join(tempDir, 'pass.json');
    await writeFile(passPath, JSON.stringify(passJson, null, 2));

    const packageFiles = ['pass.json', 'icon.png', 'logo.png', 'icon@2x.png', 'logo@2x.png'] as const;
    for (const file of packageFiles) {
      const source = file === 'pass.json'
        ? passPath
        : file.startsWith('logo')
          ? join(tempDir, file)
          : join(assetsDir, file);
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
    await runOpenSsl([
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

    const archive = buildPkPassArchiveEntries();
    const zipEntries: Array<{ name: string; data: Buffer }> = [];

    for (const file of archive.required) {
      const data = await readFile(join(tempDir, file));
      zipEntries.push({ name: file, data });
    }

    for (const file of archive.optional) {
      try {
        const data = await readFile(join(tempDir, file));
        zipEntries.push({ name: file, data });
      } catch {
        // optional files can be absent
      }
    }

    return buildZip(zipEntries);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = readCustomerId(searchParams);
    const businessId = String(searchParams.get('businessId') || searchParams.get('business_id') || '').trim();
    const businessNameInput = String(searchParams.get('businessName') || '').trim();

    if (!customerId) {
      return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido para crear wallet por negocio' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    let businessName = businessNameInput || 'Negocio afiliado';
    let requiredVisits = 10;
    let currentVisits = 0;
    let tenantLogoData: string | null = null;

    const tenant = await prisma.tenant.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, requiredVisits: true, logoData: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Negocio no encontrado para este wallet' }, { status: 404 });
    }

    businessName = tenant.name || businessName;
    requiredVisits = tenant.requiredVisits ?? 10;
    tenantLogoData = tenant.logoData || null;

    const membership = await prisma.membership.findFirst({
      where: { tenantId: tenant.id, userId: user.id },
      select: { currentVisits: true },
    });
    currentVisits = membership?.currentVisits ?? 0;

    const pkpass = await createPassPackage({
      customerId: user.id,
      businessId,
      businessName,
      requiredVisits,
      currentVisits,
      tenantLogoData,
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
    const status =
      message.startsWith('Falta env var:') ||
      message.includes('APPLE_P12_BASE64') ||
      message.includes('Verifica APPLE_P12_PASSWORD')
        ? 400
        : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
