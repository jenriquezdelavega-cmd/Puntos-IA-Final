import { generateCustomerToken } from '@/app/lib/customer-token';
import {
  ensureGoogleLoyaltyClassSynced,
  getGoogleWalletClassIdForTenant,
  getGoogleWalletIssuerId,
  GOOGLE_WALLET_PROGRAM_NAME_HIDDEN,
  upsertGoogleLoyaltyObject,
} from '@/app/lib/google-wallet';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';
import { defaultTenantWalletStyle, getTenantWalletStyle } from '@/app/lib/tenant-wallet-style';

const LOYALTY_OBJECT_SCHEMA_VERSION = 'v6';

function sanitizeIdPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._]/g, '_').slice(0, 40);
}

function parseRgbToHex(input: string, fallback: string) {
  const value = String(input || '').trim();
  if (!value) return fallback;

  const hexMatch = value.match(/^#([0-9a-fA-F]{6})$/);
  if (hexMatch) return `#${hexMatch[1].toUpperCase()}`;

  const rgbMatch = value.match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i) ||
    value.replace(/\s+/g, '').match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i);

  if (!rgbMatch) return fallback;

  const channels = rgbMatch.slice(1).map((channel) => {
    const numeric = Number(channel);
    if (!Number.isFinite(numeric)) return 0;
    return Math.min(255, Math.max(0, numeric));
  });

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function buildStampBubbles(currentVisits: number, requiredVisits: number) {
  const safeRequired = Math.max(1, requiredVisits);
  return Array.from({ length: safeRequired }, (_, index) => (index < currentVisits ? '●' : '○')).join(' ');
}

function formatPeriodLabel(period: string) {
  const normalized = String(period || '').toUpperCase();
  if (normalized === 'WEEKLY') return 'Semanal';
  if (normalized === 'MONTHLY') return 'Mensual';
  return 'Abierto';
}

function asPublicHttpUrl(value: string | null | undefined) {
  const raw = asTrimmedString(value);
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function resolveGoogleWalletImageUrl(params: {
  imageValue: string | null | undefined;
  origin: string;
  businessId: string;
  kind: 'logo' | 'strip';
}) {
  const directUrl = asPublicHttpUrl(params.imageValue);
  if (directUrl) return directUrl;

  const normalized = asTrimmedString(params.imageValue);
  if (!normalized) return '';

  const imageUrl = new URL('/api/wallet/google/image', params.origin);
  imageUrl.searchParams.set('businessId', params.businessId);
  imageUrl.searchParams.set('kind', params.kind);
  return imageUrl.toString();
}

function resolveBusinessLogoUrl(params: {
  logoValue: string | null | undefined;
  origin: string;
  businessId: string;
}) {
  const logoFromBusiness = resolveGoogleWalletImageUrl({
    imageValue: params.logoValue,
    origin: params.origin,
    businessId: params.businessId,
    kind: 'logo',
  });

  if (logoFromBusiness) return logoFromBusiness;

  const fallback = new URL('/icono.png', params.origin);
  return fallback.toString();
}

export function getGoogleLoyaltyObjectId(issuerId: string, tenantId: string, userId: string) {
  return `${issuerId}.${sanitizeIdPart(`${tenantId}_${userId}_${LOYALTY_OBJECT_SCHEMA_VERSION}`)}`;
}

export async function syncGoogleLoyaltyObjectForCustomer(params: {
  tenantId: string;
  userId: string;
  origin: string;
}) {
  const issuerId = getGoogleWalletIssuerId();
  if (!issuerId) return { ok: false as const, reason: 'issuer_missing' };

  const [user, tenant, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.userId }, select: { id: true, name: true } }),
    prisma.tenant.findUnique({
      where: { id: params.tenantId },
      select: {
        id: true,
        name: true,
        requiredVisits: true,
        rewardPeriod: true,
        prize: true,
        logoData: true,
      },
    }),
    prisma.membership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: params.tenantId,
          userId: params.userId,
        },
      },
      select: { currentVisits: true, periodType: true },
    }),
  ]);

  if (!user || !tenant) return { ok: false as const, reason: 'not_found' };

  const classId = getGoogleWalletClassIdForTenant(tenant.id);
  if (!classId) return { ok: false as const, reason: 'class_missing' };

  const walletStyle = (await getTenantWalletStyle(tenant.id)) || defaultTenantWalletStyle(tenant.id);
  const qrToken = generateCustomerToken(user.id);
  const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const qrBaseUrl = publicBaseUrl || params.origin;
  const qrValue = `${qrBaseUrl}/v/${qrToken}`;
  const currentVisits = membership?.currentVisits ?? 0;
  const requiredVisits = tenant.requiredVisits ?? 10;
  const remainingVisits = Math.max(0, requiredVisits - currentVisits);
  const logoUri = resolveBusinessLogoUrl({
    logoValue: tenant.logoData,
    origin: qrBaseUrl,
    businessId: tenant.id,
  });

  const dynamicStripUri = `${qrBaseUrl}/api/wallet/dynamic-strip?businessId=${encodeURIComponent(tenant.id)}&customerId=${encodeURIComponent(user.id)}`;

  const objectId = getGoogleLoyaltyObjectId(issuerId, tenant.id, user.id);

  const loyaltyObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountName: user.name || 'Cliente Punto IA',
    accountId: user.id,
    hexBackgroundColor: parseRgbToHex(walletStyle.backgroundColor, '#1F2937'),
    cardTitle: {
      defaultValue: {
        language: 'es-MX',
        value: tenant.name || 'Punto IA',
      },
    },
    imageModulesData: [
      {
        id: 'hero',
        mainImage: {
          sourceUri: { uri: dynamicStripUri },
          contentDescription: {
            defaultValue: { language: 'es-MX', value: `Progreso de lealtad de ${tenant.name || 'Punto IA'}` },
          },
        },
      },
    ],
    heroImage: null,
    ...(logoUri
      ? {
        logo: {
          sourceUri: { uri: logoUri },
          contentDescription: {
            defaultValue: { language: 'es-MX', value: `Logo de ${tenant.name || 'Punto IA'}` },
          },
        },
      }
      : {}),
    barcode: {
      type: 'QR_CODE',
      value: qrValue,
      alternateText: 'Visita puntoia.mx',
    },
    loyaltyPoints: {
      label: 'Visitas',
      balance: {
        int: membership?.currentVisits ?? 0,
      },
    },
    textModulesData: [
      {
        id: 'cliente',
        header: 'Cliente',
        body: user.name || 'Cliente Punto IA',
      },
      {
        id: 'periodo',
        header: 'Periodo',
        body: formatPeriodLabel(tenant.rewardPeriod || membership?.periodType || 'OPEN'),
      },
      {
        id: 'meta-visitas',
        header: 'Meta',
        body: `${currentVisits}/${requiredVisits} visitas`,
      },
      {
        id: 'premio',
        header: '🎁 Tu premio',
        body: tenant.prize || 'Premio Sorpresa',
      },
      {
        id: 'faltan',
        header: remainingVisits > 0 ? 'Faltan' : '¡Listo!',
        body: remainingVisits > 0 ? `${remainingVisits} visita${remainingVisits === 1 ? '' : 's'}` : 'Canjea tu premio',
      },
      {
        id: 'coalicion',
        header: 'Punto IA',
        body: 'Coalición de PyMEs Hecho en México 🇲🇽',
      },
      {
        id: 'sellos',
        header: '🎯 Sellos de visita',
        body: buildStampBubbles(currentVisits, requiredVisits),
      },
    ],
  };

  await ensureGoogleLoyaltyClassSynced({
    ttlMs: 0,
    classId,
    issuerName: tenant.name || 'Negocio afiliado',
    programName: GOOGLE_WALLET_PROGRAM_NAME_HIDDEN,
    logoUri: logoUri || undefined,
  });

  const result = await upsertGoogleLoyaltyObject(loyaltyObject);
  return {
    ok: result.operation !== 'failed',
    objectId,
    classId,
    operation: result.operation,
    status: result.status,
  };
}

export async function syncGoogleLoyaltyObjectsForTenant(params: {
  tenantId: string;
  origin: string;
  maxCustomers?: number;
}) {
  const memberships = await prisma.membership.findMany({
    where: { tenantId: params.tenantId },
    select: { userId: true },
    take: params.maxCustomers ?? 500,
  });

  let synced = 0;
  for (const membership of memberships) {
    try {
      const result = await syncGoogleLoyaltyObjectForCustomer({
        tenantId: params.tenantId,
        userId: membership.userId,
        origin: params.origin,
      });
      if (result.ok) synced += 1;
    } catch {
      // best effort
    }
  }

  return { total: memberships.length, synced };
}
