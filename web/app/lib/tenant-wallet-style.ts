import { prisma } from '@/app/lib/prisma';

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

export async function upsertTenantWalletStyle(params: {
  tenantId: string;
  backgroundColor?: string | null;
  foregroundColor?: string | null;
  labelColor?: string | null;
  stripImageData?: string | null;
}) {
  const current = await getTenantWalletStyle(params.tenantId);

  const backgroundColor = normalizeColor(
    params.backgroundColor,
    current?.backgroundColor || DEFAULT_STYLE.backgroundColor
  );
  const foregroundColor = normalizeColor(
    params.foregroundColor,
    current?.foregroundColor || DEFAULT_STYLE.foregroundColor
  );
  const labelColor = normalizeColor(
    params.labelColor,
    current?.labelColor || DEFAULT_STYLE.labelColor
  );

  let stripImageData: string;
  if (params.stripImageData === null) {
    stripImageData = '';
  } else if (!params.stripImageData) {
    stripImageData = current?.stripImageData || DEFAULT_STYLE.stripImageData;
  } else {
    stripImageData = normalizeImageData(params.stripImageData);
  }

  await prisma.tenantWalletStyle.upsert({
    where: { tenantId: params.tenantId },
    update: { backgroundColor, foregroundColor, labelColor, stripImageData },
    create: {
      tenantId: params.tenantId,
      backgroundColor,
      foregroundColor,
      labelColor,
      stripImageData,
    },
  });
}

export async function getTenantWalletStyle(tenantId: string): Promise<TenantWalletStyle | null> {
  const row = await prisma.tenantWalletStyle.findUnique({
    where: { tenantId },
  });

  if (!row) return null;

  return {
    tenantId: String(row.tenantId || '').trim(),
    backgroundColor: normalizeColor(row.backgroundColor, DEFAULT_STYLE.backgroundColor),
    foregroundColor: normalizeColor(row.foregroundColor, DEFAULT_STYLE.foregroundColor),
    labelColor: normalizeColor(row.labelColor, DEFAULT_STYLE.labelColor),
    stripImageData: normalizeImageData(row.stripImageData),
  };
}

export function defaultTenantWalletStyle(tenantId: string): TenantWalletStyle {
  return {
    tenantId,
    ...DEFAULT_STYLE,
  };
}
