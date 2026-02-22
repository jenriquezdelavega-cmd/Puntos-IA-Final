import { createHash } from 'crypto';
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

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { dosDate, dosTime };
}

function buildZip(entries: Array<{ name: string; data: Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const data = entry.data;
    const { dosDate, dosTime } = dosDateTime();
    const checksum = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(0, 8); // compression method: store
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localRecord = Buffer.concat([localHeader, nameBuf, data]);
    localParts.push(localRecord);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(0, 10); // compression method
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(Buffer.concat([centralHeader, nameBuf]));
    offset += localRecord.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const localDir = Buffer.concat(localParts);

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // central dir disk
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDir.length, 12);
  endRecord.writeUInt32LE(localDir.length, 16);
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localDir, centralDir, endRecord]);
}

function decodeTenantLogoData(logoDataRaw: string) {
  const raw = String(logoDataRaw || '').trim();
  if (!raw) return null;

  let base64 = raw;
  const commaIndex = raw.indexOf(',');
  if (raw.startsWith('data:') && commaIndex > -1) {
    base64 = raw.slice(commaIndex + 1);
  }

  base64 = base64
    .replace(/\\n/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  try {
    const decoded = Buffer.from(base64, 'base64');
    if (!decoded.length) return null;
    return decoded;
  } catch {
    return null;
  }
}

function buildPkPassArchiveEntries() {
  return {
    required: ['pass.json', 'manifest.json', 'signature', 'icon.png', 'logo.png'],
    optional: ['icon@2x.png', 'logo@2x.png'],
  };
}

async function createPassPackage(params: {
  customerId: string;
  businessId: string;
  businessName: string;
  requiredVisits: number;
  currentVisits: number;
  tenantLogoData?: string | null;
}) {
  const passTypeIdentifier = requiredEnv('APPLE_PASS_TYPE_IDENTIFIER');
  const teamIdentifier = requiredEnv('APPLE_TEAM_IDENTIFIER');
  const wwdrBase64 = requiredEnv('APPLE_WWDR_BASE64');
  const certP12Base64 = requiredEnv('APPLE_P12_BASE64');
  const p12Password = optionalEnv('APPLE_P12_PASSWORD', '');
  const publicBaseUrl = requiredEnv('PUBLIC_BASE_URL').replace(/\/$/, '');

  const serialNumber = `${params.customerId}-${params.businessId}`;
  const qrToken = generateCustomerToken(params.customerId);

  const tempDir = await mkdtemp(join(tmpdir(), 'pkpass-'));
  try {
    const p12Path = join(tempDir, 'cert.p12');
    const certPath = join(tempDir, 'signerCert.pem');
    const keyPath = join(tempDir, 'signerKey.pem');
    const chainPath = join(tempDir, 'wwdr.pem');

    await writeFile(p12Path, decodeP12Base64(certP12Base64));

    await writeFile(chainPath, Buffer.from(wwdrBase64, 'base64'));

    await exportPkcs12(p12Path, certPath, p12Password, ['-clcerts', '-nokeys']);
    await exportPkcs12(p12Path, keyPath, p12Password, ['-nocerts', '-nodes']);

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
