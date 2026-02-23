import { PrismaClient } from '@prisma/client';

const TABLE_NAME = 'tenant_wallet_styles';

export type TenantWalletStyle = {
  tenantId: string;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  stripImageData: string;
};

const DEFAULT_STYLE: Omit<TenantWalletStyle, 'tenantId'> = {
  backgroundColor: 'rgb(31,41,55)',
  foregroundColor: 'rgb(255,255,255)',
  labelColor: 'rgb(191,219,254)',
  stripImageData: '',
};

function normalizeColor(value: unknown, fallback: string) {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  if (/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/.test(raw.replace(/\s+/g, ''))) return raw;
  return fallback;
}

function normalizeImageData(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw;
}

export async function ensureTenantWalletStylesTable(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      tenant_id TEXT PRIMARY KEY,
      background_color TEXT NOT NULL DEFAULT 'rgb(31,41,55)',
      foreground_color TEXT NOT NULL DEFAULT 'rgb(255,255,255)',
      label_color TEXT NOT NULL DEFAULT 'rgb(191,219,254)',
      strip_image_data TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function upsertTenantWalletStyle(prisma: PrismaClient, params: {
  tenantId: string;
  backgroundColor?: string;
  foregroundColor?: string;
  labelColor?: string;
  stripImageData?: string;
}) {
  await ensureTenantWalletStylesTable(prisma);

  const backgroundColor = normalizeColor(params.backgroundColor, DEFAULT_STYLE.backgroundColor);
  const foregroundColor = normalizeColor(params.foregroundColor, DEFAULT_STYLE.foregroundColor);
  const labelColor = normalizeColor(params.labelColor, DEFAULT_STYLE.labelColor);
  const stripImageData = normalizeImageData(params.stripImageData);

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO ${TABLE_NAME}
        (tenant_id, background_color, foreground_color, label_color, strip_image_data, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        background_color = EXCLUDED.background_color,
        foreground_color = EXCLUDED.foreground_color,
        label_color = EXCLUDED.label_color,
        strip_image_data = EXCLUDED.strip_image_data,
        updated_at = NOW()
    `,
    params.tenantId,
    backgroundColor,
    foregroundColor,
    labelColor,
    stripImageData
  );
}

export async function getTenantWalletStyle(prisma: PrismaClient, tenantId: string): Promise<TenantWalletStyle | null> {
  await ensureTenantWalletStylesTable(prisma);

  const rows = await prisma.$queryRawUnsafe<Array<{
    tenant_id: string;
    background_color: string;
    foreground_color: string;
    label_color: string;
    strip_image_data: string;
  }>>(
    `
      SELECT tenant_id, background_color, foreground_color, label_color, strip_image_data
      FROM ${TABLE_NAME}
      WHERE tenant_id = $1
      LIMIT 1
    `,
    tenantId
  );

  if (!rows.length) return null;

  const row = rows[0];
  return {
    tenantId: String(row.tenant_id || '').trim(),
    backgroundColor: normalizeColor(row.background_color, DEFAULT_STYLE.backgroundColor),
    foregroundColor: normalizeColor(row.foreground_color, DEFAULT_STYLE.foregroundColor),
    labelColor: normalizeColor(row.label_color, DEFAULT_STYLE.labelColor),
    stripImageData: normalizeImageData(row.strip_image_data),
  };
}

export function defaultTenantWalletStyle(tenantId: string): TenantWalletStyle {
  return {
    tenantId,
    ...DEFAULT_STYLE,
  };
}
