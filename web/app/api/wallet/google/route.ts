import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { generateCustomerToken } from '@/app/lib/customer-token';
import { defaultTenantWalletStyle, getTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';
import {
  getGoogleWalletClassId,
  getGoogleWalletIssuerId,
  googleWalletConfigErrorResponse,
  ensureGoogleLoyaltyClassSynced,
  parseGoogleServiceAccount,
  signSaveToWalletJwt,
} from '@/app/lib/google-wallet';

export const runtime = 'nodejs';

function sanitizeIdPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, '_').slice(0, 40);
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

function formatDateEs(date: Date | null | undefined) {
  if (!date) return 'Sin registro';
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
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

  const fallback = new URL('/icon.svg', params.origin);
  return fallback.toString();
}

function normalizeInstagramHandle(value: string | null | undefined) {
  const normalized = asTrimmedString(value);
  if (!normalized) return '';
  return normalized.replace(/^@+/, '');
}

export async function GET(req: Request) {
  const requestId = getRequestId(req);

  try {
    const issuerId = getGoogleWalletIssuerId();

    if (!issuerId) {
      return apiError({
        requestId,
        status: 500,
        code: 'INTERNAL_ERROR',
        message: googleWalletConfigErrorResponse().error,
      });
    }

    const url = new URL(req.url);
    const customerId = asTrimmedString(url.searchParams.get('customerId'));
    const businessId = asTrimmedString(url.searchParams.get('businessId'));

    if (!customerId || !businessId) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'customerId y businessId son requeridos',
      });
    }

    const [user, tenant, membership] = await Promise.all([
      prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true, createdAt: true } }),
      prisma.tenant.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
          requiredVisits: true,
          rewardPeriod: true,
          prize: true,
          address: true,
          instagram: true,
          logoData: true,
        },
      }),
      prisma.membership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: businessId,
            userId: customerId,
          },
        },
        select: { currentVisits: true, totalVisits: true, lastVisitAt: true, periodType: true },
      }),
    ]);

    if (!user || !tenant) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Cliente o negocio no encontrado',
      });
    }

    const classId = getGoogleWalletClassId();

    if (!classId) {
      return apiError({
        requestId,
        status: 500,
        code: 'INTERNAL_ERROR',
        message: googleWalletConfigErrorResponse().error,
      });
    }

    const objectId = `${issuerId}.${sanitizeIdPart(`${tenant.id}_${user.id}`)}`;
    const walletStyle = (await getTenantWalletStyle(tenant.id)) || defaultTenantWalletStyle(tenant.id);
    const qrToken = generateCustomerToken(user.id);
    const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const requestOrigin = new URL(req.url).origin;
    const qrBaseUrl = publicBaseUrl || requestOrigin;
    const qrValue = `${qrBaseUrl}/v/${qrToken}`;
    const currentVisits = membership?.currentVisits ?? 0;
    const requiredVisits = tenant.requiredVisits ?? 10;
    const remainingVisits = Math.max(0, requiredVisits - currentVisits);
    const totalVisits = membership?.totalVisits ?? currentVisits;
    const logoUri = resolveBusinessLogoUrl({
      logoValue: tenant.logoData,
      origin: qrBaseUrl,
      businessId: tenant.id,
    });
    const stripUri = resolveGoogleWalletImageUrl({
      imageValue: walletStyle.stripImageData,
      origin: qrBaseUrl,
      businessId: tenant.id,
      kind: 'strip',
    });
    const instagramHandle = normalizeInstagramHandle(tenant.instagram);
    const walletStyleRow = await prisma.tenantWalletStyle.findUnique({
      where: { tenantId: tenant.id },
      select: { lastPushMessage: true },
    });
    const lastPushMessage = asTrimmedString(walletStyleRow?.lastPushMessage);

    const account = parseGoogleServiceAccount();

    const jwtPayload = {
      iss: account.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        loyaltyObjects: [
          {
            id: objectId,
            classId,
            state: 'ACTIVE',
            accountName: user.name || 'Cliente Punto IA',
            accountId: user.id,
            hexBackgroundColor: parseRgbToHex(walletStyle.backgroundColor, '#1F2937'),
            cardTitle: {
              defaultValue: {
                language: 'es-MX',
                value: tenant.name || 'Negocio afiliado',
              },
            },
            header: {
              defaultValue: {
                language: 'es-MX',
                value: `${currentVisits} / ${requiredVisits} visitas`,
              },
            },
            subheader: {
              defaultValue: {
                language: 'es-MX',
                value: tenant.name || 'Negocio afiliado',
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
            ...(logoUri
              ? {
                wideLogo: {
                  sourceUri: { uri: logoUri },
                  contentDescription: {
                    defaultValue: { language: 'es-MX', value: `Logo de ${tenant.name || 'Punto IA'}` },
                  },
                },
              }
              : {}),
            ...(stripUri
              ? {
                heroImage: {
                  sourceUri: { uri: stripUri },
                  contentDescription: {
                    defaultValue: { language: 'es-MX', value: `Imagen del pase de ${tenant.name || 'Punto IA'}` },
                  },
                },
              }
              : {}),
            ...(stripUri
              ? {
                imageModulesData: [
                  {
                    id: 'imagen-negocio',
                    mainImage: {
                      sourceUri: { uri: stripUri },
                      contentDescription: {
                        defaultValue: {
                          language: 'es-MX',
                          value: `Imagen promocional de ${tenant.name || 'Punto IA'}`,
                        },
                      },
                    },
                  },
                ],
              }
              : {}),
            barcode: {
              type: 'QR_CODE',
              value: qrValue,
              alternateText: 'Escanea en caja para registrar tu visita',
            },
            loyaltyPoints: {
              label: 'Visitas',
              balance: {
                int: membership?.currentVisits ?? 0,
              },
            },
            textModulesData: [
              {
                id: 'negocio',
                header: 'Negocio',
                body: tenant.name || 'Negocio afiliado',
              },
              {
                id: 'cliente',
                header: 'Cliente',
                body: user.name || 'Cliente Punto IA',
              },
              {
                id: 'meta-visitas',
                header: 'Meta',
                body: `${currentVisits}/${requiredVisits} visitas`,
              },
              {
                id: 'sellos',
                header: '🎯 Sellos de visita',
                body: buildStampBubbles(currentVisits, requiredVisits),
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
              {
                id: 'miembro-desde',
                header: 'Miembro desde',
                body: formatDateEs(user.createdAt),
              },
              {
                id: 'ultima-visita',
                header: 'Última visita',
                body: formatDateEs(membership?.lastVisitAt),
              },
              {
                id: 'historial',
                header: 'Historial',
                body: `${totalVisits} visita${totalVisits === 1 ? '' : 's'} en total`,
              },
              {
                id: 'id-miembro',
                header: 'ID de miembro',
                body: user.id,
              },
              {
                id: 'ultimo-aviso',
                header: '📢 Último aviso',
                body: lastPushMessage || 'Sin avisos recientes',
              },
              ...(tenant.address
                ? [
                  {
                    id: 'ubicacion',
                    header: '📍 Ubicación',
                    body: tenant.address,
                  },
                ]
                : []),
              ...(instagramHandle
                ? [
                  {
                    id: 'instagram',
                    header: '📸 Instagram',
                    body: `@${instagramHandle}`,
                  },
                ]
                : []),
              {
                id: 'ayuda',
                header: 'ℹ️ Ayuda',
                body: 'Muestra este pase y escanea el QR del día para registrar tu visita.',
              },
              {
                id: 'brand',
                header: '✦ Punto IA',
                body: 'Coalición de PyMEs que premia tu lealtad. Visita puntoia.mx',
              },
            ],
            ...(tenant.address || instagramHandle
              ? {
                linksModuleData: {
                  uris: [
                    ...(tenant.address
                      ? [
                        {
                          id: 'ubicacion',
                          description: '📍 Ubicación',
                          uri: `https://maps.google.com/?q=${encodeURIComponent(tenant.address)}`,
                        },
                      ]
                      : []),
                    ...(instagramHandle
                      ? [
                        {
                          id: 'instagram',
                          description: '📸 Instagram',
                          uri: `https://instagram.com/${instagramHandle}`,
                        },
                      ]
                      : []),
                  ],
                },
              }
              : {}),
          },
        ],
      },
    };

    void ensureGoogleLoyaltyClassSynced().catch((classSyncError) => {
      console.warn('[wallet/google] class sync skipped:', classSyncError instanceof Error ? classSyncError.message : classSyncError);
    });

    const token = signSaveToWalletJwt(jwtPayload, account.private_key || '');

    return apiSuccess({
      requestId,
      data: {
        saveUrl: `https://pay.google.com/gp/v/save/${token}`,
        classId,
        objectId,
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
