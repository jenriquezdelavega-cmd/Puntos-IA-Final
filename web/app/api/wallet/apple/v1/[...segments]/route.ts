import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
  deleteWalletRegistration,
  listUpdatedSerialsForDevice,
  upsertWalletRegistration,
  verifyWalletAuthToken
} from '@/app/lib/apple-wallet-webservice';

function parseApplePassAuth(req: Request) {
  const auth = String(req.headers.get('authorization') || '').trim();
  if (!auth) return '';
  const match = auth.match(/^ApplePass\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function splitSerialLegacy(serialNumber: string) {
  const value = String(serialNumber || '').trim();
  const idx = value.lastIndexOf('-');
  if (idx <= 0 || idx >= value.length - 1) return null;
  return {
    customerId: value.slice(0, idx),
    businessId: value.slice(idx + 1),
  };
}

async function resolveSerialToIds(serialNumber: string) {
  const value = String(serialNumber || '').trim();
  if (!value) return null;

  const rows = await prisma.$queryRaw<Array<{ userId: string; tenantId: string }>>`
    SELECT "userId", "tenantId"
    FROM "Membership"
    WHERE ("userId" || '-' || "tenantId") = ${value}
    LIMIT 1
  `;

  if (rows.length > 0) {
    return {
      customerId: String(rows[0].userId || '').trim(),
      businessId: String(rows[0].tenantId || '').trim(),
    };
  }

  // Fallback para pases viejos o seriales no encontrados en Membership.
  return splitSerialLegacy(value);
}

function requiredPassType() {
  const value = String(process.env.APPLE_PASS_TYPE_ID || '').trim();
  if (!value) throw new Error('Falta env var: APPLE_PASS_TYPE_ID');
  return value;
}

export async function GET(req: Request, context: { params: Promise<{ segments: string[] }> }) {
  try {
    const passTypeIdentifier = requiredPassType();
    const { segments = [] } = await context.params;
    const url = new URL(req.url);

    // GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
    if (segments[0] === 'devices' && segments[2] === 'registrations' && segments.length === 4) {
      const deviceLibraryIdentifier = String(segments[1] || '').trim();
      const passType = String(segments[3] || '').trim();
      if (!deviceLibraryIdentifier || !passType) {
        return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
      }
      if (passType !== passTypeIdentifier) {
        return NextResponse.json({ error: 'passTypeIdentifier inválido' }, { status: 404 });
      }

      const passesUpdatedSince = String(url.searchParams.get('passesUpdatedSince') || '').trim();
      const data = await listUpdatedSerialsForDevice(prisma, {
        passTypeIdentifier,
        deviceLibraryIdentifier,
        passesUpdatedSince,
      });

      return NextResponse.json(data, { status: 200 });
    }

    // GET /v1/passes/{passTypeIdentifier}/{serialNumber}
    if (segments[0] === 'passes' && segments.length === 3) {
      const passType = String(segments[1] || '').trim();
      const serialNumber = String(segments[2] || '').trim();
      if (!passType || !serialNumber) {
        return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
      }
      if (passType !== passTypeIdentifier) {
        return NextResponse.json({ error: 'passTypeIdentifier inválido' }, { status: 404 });
      }

      const authToken = parseApplePassAuth(req);
      if (!authToken || !verifyWalletAuthToken(serialNumber, authToken)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const parsed = await resolveSerialToIds(serialNumber);

      if (!parsed) {
        return NextResponse.json({ error: 'serialNumber inválido' }, { status: 400 });
      }

      const origin = `${url.protocol}//${url.host}`;
      const regenerateUrl = `${origin}/api/wallet/apple?customerId=${encodeURIComponent(parsed.customerId)}&businessId=${encodeURIComponent(parsed.businessId)}`;
      const res = await fetch(regenerateUrl, { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text();
        return new NextResponse(text || 'No se pudo regenerar pass', { status: res.status });
      }

      const buf = Buffer.from(await res.arrayBuffer());
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ error: 'Ruta no soportada' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error técnico';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ segments: string[] }> }) {
  try {
    const passTypeIdentifier = requiredPassType();
    const { segments = [] } = await context.params;

    // POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    if (segments[0] === 'devices' && segments[2] === 'registrations' && segments.length === 5) {
      const deviceLibraryIdentifier = String(segments[1] || '').trim();
      const passType = String(segments[3] || '').trim();
      const serialNumber = String(segments[4] || '').trim();
      if (!deviceLibraryIdentifier || !passType || !serialNumber) {
        return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
      }
      if (passType !== passTypeIdentifier) {
        return NextResponse.json({ error: 'passTypeIdentifier inválido' }, { status: 404 });
      }

      const authToken = parseApplePassAuth(req);
      if (!authToken || !verifyWalletAuthToken(serialNumber, authToken)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      const body = await req.json().catch(() => ({}));
      const pushToken = String(body?.pushToken || '').trim();
      if (!pushToken) {
        return NextResponse.json({ error: 'pushToken requerido' }, { status: 400 });
      }

      await upsertWalletRegistration(prisma, {
        serialNumber,
        passTypeIdentifier,
        deviceLibraryIdentifier,
        pushToken,
        authToken,
      });

      return new NextResponse(null, { status: 201 });
    }

    // POST /v1/log
    if (segments[0] === 'log') {
      return new NextResponse(null, { status: 200 });
    }

    return NextResponse.json({ error: 'Ruta no soportada' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error técnico';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ segments: string[] }> }) {
  try {
    const passTypeIdentifier = requiredPassType();
    const { segments = [] } = await context.params;

    // DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    if (segments[0] === 'devices' && segments[2] === 'registrations' && segments.length === 5) {
      const deviceLibraryIdentifier = String(segments[1] || '').trim();
      const passType = String(segments[3] || '').trim();
      const serialNumber = String(segments[4] || '').trim();
      if (!deviceLibraryIdentifier || !passType || !serialNumber) {
        return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
      }
      if (passType !== passTypeIdentifier) {
        return NextResponse.json({ error: 'passTypeIdentifier inválido' }, { status: 404 });
      }

      const authToken = parseApplePassAuth(req);
      if (!authToken || !verifyWalletAuthToken(serialNumber, authToken)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }

      await deleteWalletRegistration(prisma, {
        serialNumber,
        passTypeIdentifier,
        deviceLibraryIdentifier,
      });

      return new NextResponse(null, { status: 200 });
    }

    return NextResponse.json({ error: 'Ruta no soportada' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error técnico';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
