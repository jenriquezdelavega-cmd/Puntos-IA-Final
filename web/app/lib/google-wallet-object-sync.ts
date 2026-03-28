import { generateCustomerToken } from '@/app/lib/customer-token';
import { createHash } from 'node:crypto';
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
import { isWalletAssetVersioningEnabled } from '@/app/lib/wallet-asset-versioning';

const LEGACY_SCHEMA_VERSIONS = ['v6', 'v5', 'v4', 'v3', 'v2', 'v1'] as const;

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

function withCacheKey(url: string, cacheKey?: string) {
  if (!cacheKey) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set('v', cacheKey);
    return parsed.toString();
  } catch {
    return url;
  }
}

function resolveGoogleWalletImageUrl(params: {
  imageValue: string | null | undefined;
  origin: string;
  businessId: string;
  kind: 'logo' | 'strip';
  cacheKey?: string;
}) {
  const directUrl = asPublicHttpUrl(params.imageValue);
  if (directUrl) return withCacheKey(directUrl, params.cacheKey);

  const normalized = asTrimmedString(params.imageValue);
  if (!normalized) return '';

  const imageUrl = new URL('/api/wallet/google/image', params.origin);
  imageUrl.searchParams.set('businessId', params.businessId);
  imageUrl.searchParams.set('kind', params.kind);
  if (params.cacheKey) {
    imageUrl.searchParams.set('v', params.cacheKey);
  }
  return imageUrl.toString();
}

function resolveBusinessLogoUrl(params: {
  logoValue: string | null | undefined;
  origin: string;
  businessId: string;
  cacheKey?: string;
}) {
  const logoFromBusiness = resolveGoogleWalletImageUrl({
    imageValue: params.logoValue,
    origin: params.origin,
    businessId: params.businessId,
    kind: 'logo',
    cacheKey: params.cacheKey,
  });

  if (logoFromBusiness) return logoFromBusiness;

  const fallback = new URL('/icono.png', params.origin);
  return fallback.toString();
}

export function getGoogleLoyaltyObjectId(issuerId: string, tenantId: string, userId: string) {
  return `${issuerId}.${sanitizeIdPart(`${tenantId}_${userId}`)}`;
}

function getLegacyGoogleLoyaltyObjectIds(issuerId: string, tenantId: string, userId: string) {
  return LEGACY_SCHEMA_VERSIONS.map((version) => (
    `${issuerId}.${sanitizeIdPart(`${tenantId}_${userId}_${version}`)}`
  ));
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
      include: {
        loyaltyMilestones: {
          orderBy: { visitTarget: 'asc' },
          select: {
            visitTarget: true,
            reward: true,
            emoji: true,
            updatedAt: true,
          },
        },
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
  const walletVersionSeed = JSON.stringify({
    tenantCreatedAt: tenant.createdAt?.toISOString?.() || '',
    currentVisits,
    requiredVisits,
    rewardPeriod: tenant.rewardPeriod || membership?.periodType || 'OPEN',
    prize: tenant.prize || '',
    walletStyle,
    milestones: tenant.loyaltyMilestones.map((milestone) => ({
      visitTarget: milestone.visitTarget,
      reward: milestone.reward,
      emoji: milestone.emoji,
      updatedAt: milestone.updatedAt?.toISOString?.() || '',
    })),
  });
  const walletVersion = createHash('sha1').update(walletVersionSeed).digest('hex').slice(0, 12);
  const versioningEnabled = isWalletAssetVersioningEnabled();
  const walletCacheKey = versioningEnabled ? walletVersion : undefined;
  const logoUri = resolveBusinessLogoUrl({
    logoValue: tenant.logoData,
    origin: qrBaseUrl,
    businessId: tenant.id,
    cacheKey: walletCacheKey,
  });

  const dynamicStripParams = new URLSearchParams({
    businessId: tenant.id,
    customerId: user.id,
    v: String(currentVisits),
    goal: String(requiredVisits),
  });
  if (walletCacheKey) {
    dynamicStripParams.set('rev', walletCacheKey);
  }
  const dynamicStripUri = `${qrBaseUrl}/api/wallet/dynamic-strip?${dynamicStripParams.toString()}`;

  const objectId = getGoogleLoyaltyObjectId(issuerId, tenant.id, user.id);

  const loyaltyObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    accountName: user.name || 'Cliente Punto IA',
    hexBackgroundColor: parseRgbToHex(walletStyle.backgroundColor, '#1F2937'),
    cardTitle: {
      defaultValue: {
        language: 'es-MX',
        value: tenant.name || 'Punto IA',
      },
    },
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
      label: `Sellos ${currentVisits}/${requiredVisits}`,
      balance: {
        int: membership?.currentVisits ?? 0,
      },
    },
    imageModulesData: [
      {
        id: 'hero',
        mainImage: {
          sourceUri: {
            uri: dynamicStripUri,
          },
          contentDescription: {
            defaultValue: {
              language: 'es-MX',
              value: `Tarjeta de sellos de ${tenant.name || 'Punto IA'}`,
            },
          },
        },
      },
    ],
    textModulesData: [
      {
        id: 'meta-visitas',
        header: 'Visitas',
        body: `${currentVisits}/${requiredVisits}`,
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
        id: 'periodo',
        header: 'Periodo',
        body: formatPeriodLabel(tenant.rewardPeriod || membership?.periodType || 'OPEN'),
      },
    ],
  };

  // Sync the class first — swallow errors so object upsert can still proceed
  try {
    await ensureGoogleLoyaltyClassSynced({
      ttlMs: 5 * 60 * 1000,
      classId,
      issuerName: tenant.name || 'Negocio afiliado',
      programName: GOOGLE_WALLET_PROGRAM_NAME_HIDDEN,
      logoUri: logoUri || undefined,
      programColor: parseRgbToHex(walletStyle.backgroundColor, '#1F2937'),
    });
  } catch (classErr) {
    console.warn('Google Wallet class sync warning (non-fatal):', classErr);
  }

  const legacyObjectIds = getLegacyGoogleLoyaltyObjectIds(issuerId, tenant.id, user.id);
  const syncTargets = Array.from(new Set([objectId, ...legacyObjectIds]));

  const primaryTargetId = syncTargets[0];
  const result = await upsertGoogleLoyaltyObject({
    ...loyaltyObject,
    id: primaryTargetId,
  });
  if (result.operation === 'failed') {
    console.error('Google Wallet object upsert failed:', primaryTargetId, result.status, JSON.stringify(result.body));
  }

  const legacyTargets = syncTargets.slice(1);
  await Promise.all(
    legacyTargets.map(async (targetId) => {
      const targetResult = await upsertGoogleLoyaltyObject({
        ...loyaltyObject,
        id: targetId,
      });
      if (targetResult.operation === 'failed') {
        console.error('Google Wallet legacy upsert failed:', targetId, targetResult.status, JSON.stringify(targetResult.body));
      }
    }),
  );

  return {
    ok: result.operation !== 'failed',
    reason: result.operation === 'failed' ? ('upsert_failed' as const) : undefined,
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
