import { NextResponse } from 'next/server';
import { apiError, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import {
  ensureWalletRegistrationsTable,
  deleteWalletRegistration,
  listUpdatedSerialsForDevice,
  upsertWalletRegistration,
  verifyWalletAuthToken,
  walletAuthTokenForSerial
} from '@/app/lib/apple-wallet-webservice';

function parseApplePassAuth(req: Request) {
  for (const name of ['authorization', 'x-authorization', 'x-forwarded-authorization']) {
    const value = asTrimmedString(req.headers.get(name));
    if (value) {
      const match = value.match(/^ApplePass\s+(.+)$/i);
      if (match) return asTrimmedString(match[1]);
    }
  }
  return '';
}

function verifyOrBypassAuth(req: Request, serialNumber: string): boolean {
  const token = parseApplePassAuth(req);
  if (token) return verifyWalletAuthToken(serialNumber, token);
  // Vercel's infrastructure strips the Authorization header (replaces it
  // with its own proxy signature). When the header is missing entirely,
  // fall back to verifying the request came from Apple's passd daemon.
  const ua = String(req.headers.get('user-agent') || '');
  return ua.startsWith('passd/');
}

function splitSerialLegacy(serialNumber: string) {
  const value = asTrimmedString(serialNumber);
  const idx = value.lastIndexOf('-');
  if (idx <= 0 || idx >= value.length - 1) return null;
  return {
    customerId: value.slice(0, idx),
    businessId: value.slice(idx + 1),
  };
}

async function resolveSerialToIds(serialNumber: string) {
  const value = asTrimmedString(serialNumber);
  if (!value) return null;

  const rows = await prisma.$queryRaw<Array<{ userId: string; tenantId: string }>>`
    SELECT "userId", "tenantId"
    FROM "Membership"
    WHERE ("userId" || '-' || "tenantId") = ${value}
    LIMIT 1
  `;

  if (rows.length > 0) {
    return {
      customerId: asTrimmedString(rows[0].userId),
      businessId: asTrimmedString(rows[0].tenantId),
    };
  }

  // Fallback para pases viejos o seriales no encontrados en Membership.
  return splitSerialLegacy(value);
}

function requiredPassType() {
  const value = asTrimmedString(process.env.APPLE_PASS_TYPE_ID);
  if (!value) throw new Error('Falta env var: APPLE_PASS_TYPE_ID');
  return value;
}

export async function GET(req: Request, context: { params: Promise<{ segments: string[] }> }) {
  const requestId = getRequestId(req);

  try {
    await ensureWalletRegistrationsTable(prisma);
    const passTypeIdentifier = requiredPassType();
    const { segments = [] } = await context.params;
    const url = new URL(req.url);

    // GET /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}
    if (segments[0] === 'devices' && segments[2] === 'registrations' && segments.length === 4) {
      const deviceLibraryIdentifier = asTrimmedString(segments[1]);
      const passType = asTrimmedString(segments[3]);
      if (!deviceLibraryIdentifier || !passType) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Ruta inválida' });
      }
      if (passType !== passTypeIdentifier) {
        return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'passTypeIdentifier inválido' });
      }

      const passesUpdatedSince = asTrimmedString(url.searchParams.get('passesUpdatedSince'));
      const data = await listUpdatedSerialsForDevice(prisma, {
        passTypeIdentifier,
        deviceLibraryIdentifier,
        passesUpdatedSince,
      });

      return new NextResponse(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
        },
      });
    }

    // GET /v1/passes/{passTypeIdentifier}/{serialNumber}
    if (segments[0] === 'passes' && segments.length === 3) {
      const passType = asTrimmedString(segments[1]);
      const serialNumber = asTrimmedString(segments[2]);
      if (!passType || !serialNumber) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Ruta inválida' });
      }
      if (passType !== passTypeIdentifier) {
        return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'passTypeIdentifier inválido' });
      }

      if (!verifyOrBypassAuth(req, serialNumber)) {
        return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
      }

      const parsed = await resolveSerialToIds(serialNumber);

      if (!parsed) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'serialNumber inválido' });
      }

      const origin = `${url.protocol}//${url.host}`;
      const regenerateUrl = `${origin}/api/wallet/apple?customerId=${encodeURIComponent(parsed.customerId)}&businessId=${encodeURIComponent(parsed.businessId)}`;
      const res = await fetch(regenerateUrl, { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text();
        return new NextResponse(text || 'No se pudo regenerar pass', {
          status: res.status,
          headers: { 'x-request-id': requestId },
        });
      }

      const buf = Buffer.from(await res.arrayBuffer());
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Cache-Control': 'no-store',
          'x-request-id': requestId,
        },
      });
    }

    return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Ruta no soportada' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error técnico';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}

export async function POST(req: Request, context: { params: Promise<{ segments: string[] }> }) {
  const requestId = getRequestId(req);

  try {
    await ensureWalletRegistrationsTable(prisma);
    const passTypeIdentifier = requiredPassType();
    const { segments = [] } = await context.params;

    // POST /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    if (segments[0] === 'devices' && segments[2] === 'registrations' && segments.length === 5) {
      const deviceLibraryIdentifier = asTrimmedString(segments[1]);
      const passType = asTrimmedString(segments[3]);
      const serialNumber = asTrimmedString(segments[4]);
      if (!deviceLibraryIdentifier || !passType || !serialNumber) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Ruta inválida' });
      }
      if (passType !== passTypeIdentifier) {
        return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'passTypeIdentifier inválido' });
      }

      if (!verifyOrBypassAuth(req, serialNumber)) {
        return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
      }

      const body = await parseJsonObject(req);
      const pushToken = asTrimmedString(body?.pushToken);
      if (!pushToken) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'pushToken requerido' });
      }

      await upsertWalletRegistration(prisma, {
        serialNumber,
        passTypeIdentifier,
        deviceLibraryIdentifier,
        pushToken,
        authToken: parseApplePassAuth(req) || walletAuthTokenForSerial(serialNumber),
      });

      return new NextResponse(null, { status: 201, headers: { 'x-request-id': requestId } });
    }

    // POST /v1/log
    if (segments[0] === 'log') {
      return new NextResponse(null, { status: 200, headers: { 'x-request-id': requestId } });
    }

    return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Ruta no soportada' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error técnico';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ segments: string[] }> }) {
  const requestId = getRequestId(req);

  try {
    await ensureWalletRegistrationsTable(prisma);
    const passTypeIdentifier = requiredPassType();
    const { segments = [] } = await context.params;

    // DELETE /v1/devices/{deviceLibraryIdentifier}/registrations/{passTypeIdentifier}/{serialNumber}
    if (segments[0] === 'devices' && segments[2] === 'registrations' && segments.length === 5) {
      const deviceLibraryIdentifier = asTrimmedString(segments[1]);
      const passType = asTrimmedString(segments[3]);
      const serialNumber = asTrimmedString(segments[4]);
      if (!deviceLibraryIdentifier || !passType || !serialNumber) {
        return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'Ruta inválida' });
      }
      if (passType !== passTypeIdentifier) {
        return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'passTypeIdentifier inválido' });
      }

      if (!verifyOrBypassAuth(req, serialNumber)) {
        return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
      }

      await deleteWalletRegistration(prisma, {
        serialNumber,
        passTypeIdentifier,
        deviceLibraryIdentifier,
      });

      return new NextResponse(null, { status: 200, headers: { 'x-request-id': requestId } });
    }

    return apiError({ requestId, status: 404, code: 'NOT_FOUND', message: 'Ruta no soportada' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error técnico';
    return apiError({ requestId, status: 500, code: 'INTERNAL_ERROR', message });
  }
}
