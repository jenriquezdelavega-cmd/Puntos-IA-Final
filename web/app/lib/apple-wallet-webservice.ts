import { createHmac } from 'crypto';
import { PrismaClient } from '@prisma/client';

const TABLE_NAME = 'apple_wallet_registrations';

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function walletSecret() {
  return (
    process.env.APPLE_WALLET_AUTH_SECRET ||
    process.env.PASS_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'dev-wallet-auth-secret-change-me'
  );
}

export function walletSerialNumber(customerId: string, businessId: string) {
  return `${String(customerId || '').trim()}-${String(businessId || '').trim()}`;
}

export function walletAuthTokenForSerial(serialNumber: string) {
  const digest = createHmac('sha256', walletSecret()).update(String(serialNumber || '').trim()).digest();
  return base64Url(digest);
}

export function verifyWalletAuthToken(serialNumber: string, token: string) {
  return walletAuthTokenForSerial(serialNumber) === String(token || '').trim();
}

export async function ensureWalletRegistrationsTable(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      serial_number TEXT NOT NULL,
      pass_type_identifier TEXT NOT NULL,
      device_library_identifier TEXT NOT NULL,
      push_token TEXT NOT NULL,
      auth_token TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (serial_number, pass_type_identifier, device_library_identifier)
    )
  `);
}

export async function upsertWalletRegistration(prisma: PrismaClient, params: {
  serialNumber: string;
  passTypeIdentifier: string;
  deviceLibraryIdentifier: string;
  pushToken: string;
  authToken: string;
}) {
  await ensureWalletRegistrationsTable(prisma);
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO ${TABLE_NAME}
        (serial_number, pass_type_identifier, device_library_identifier, push_token, auth_token, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (serial_number, pass_type_identifier, device_library_identifier)
      DO UPDATE SET
        push_token = EXCLUDED.push_token,
        auth_token = EXCLUDED.auth_token,
        updated_at = NOW()
    `,
    params.serialNumber,
    params.passTypeIdentifier,
    params.deviceLibraryIdentifier,
    params.pushToken,
    params.authToken
  );
}

export async function deleteWalletRegistration(prisma: PrismaClient, params: {
  serialNumber: string;
  passTypeIdentifier: string;
  deviceLibraryIdentifier: string;
}) {
  await ensureWalletRegistrationsTable(prisma);
  await prisma.$executeRawUnsafe(
    `
      DELETE FROM ${TABLE_NAME}
      WHERE serial_number = $1
        AND pass_type_identifier = $2
        AND device_library_identifier = $3
    `,
    params.serialNumber,
    params.passTypeIdentifier,
    params.deviceLibraryIdentifier
  );
}

export async function listUpdatedSerialsForDevice(prisma: PrismaClient, params: {
  passTypeIdentifier: string;
  deviceLibraryIdentifier: string;
  passesUpdatedSince?: string;
}) {
  await ensureWalletRegistrationsTable(prisma);

  const rows = await prisma.$queryRawUnsafe<Array<{ serial_number: string; updated_at: Date }>>(
    `
      SELECT serial_number, updated_at
      FROM ${TABLE_NAME}
      WHERE pass_type_identifier = $1
        AND device_library_identifier = $2
        AND updated_at > COALESCE($3::timestamptz, to_timestamp(0))
      ORDER BY updated_at ASC
    `,
    params.passTypeIdentifier,
    params.deviceLibraryIdentifier,
    params.passesUpdatedSince || null
  );

  const serialNumbers = rows.map((row) => row.serial_number);
  const lastUpdated = rows.length ? new Date(rows[rows.length - 1].updated_at).toISOString() : new Date().toISOString();

  return { serialNumbers, lastUpdated };
}

export async function touchWalletPassRegistrations(prisma: PrismaClient, params: {
  serialNumber: string;
  passTypeIdentifier?: string;
}) {
  await ensureWalletRegistrationsTable(prisma);

  if (params.passTypeIdentifier) {
    const updatedWithPassType = await prisma.$executeRawUnsafe(
      `
        UPDATE ${TABLE_NAME}
        SET updated_at = NOW()
        WHERE serial_number = $1
          AND pass_type_identifier = $2
      `,
      params.serialNumber,
      params.passTypeIdentifier
    );

    if (updatedWithPassType > 0) {
      return;
    }
  }

  await prisma.$executeRawUnsafe(
    `
      UPDATE ${TABLE_NAME}
      SET updated_at = NOW()
      WHERE serial_number = $1
    `,
    params.serialNumber
  );
}


