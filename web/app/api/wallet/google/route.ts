import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';
import { defaultTenantWalletStyle, getTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import {
  getGoogleWalletClassId,
  getGoogleWalletIssuerId,
  googleWalletConfigErrorResponse,
  parseGoogleServiceAccount,
  signSaveToWalletJwt,
} from '@/app/lib/google-wallet';

export const runtime = 'nodejs';

function sanitizeIdPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, '_').slice(0, 40);
}

function formatDateEs(value: Date | null | undefined) {
  if (!value) return 'Sin registro';

  try {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Mexico_City',
    }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function formatPeriodLabel(value: string | null | undefined) {
  const normalized = String(value || 'OPEN').toUpperCase();
  if (normalized === 'DAILY') return 'Diario';
  if (normalized === 'WEEKLY') return 'Semanal';
  if (normalized === 'MONTHLY') return 'Mensual';
  if (normalized === 'YEARLY') return 'Anual';
  return 'Abierto';
}

function rgbToHex(color: string | null | undefined, fallback = '#1f2937') {
  const raw = asTrimmedString(color);
  if (!raw) return fallback;

  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;

  const match = raw.match(/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/i);
  if (!match) return fallback;

  const [r, g, b] = match.slice(1).map((part) => {
    const value = Number(part);
    return Number.isFinite(value) ? Math.max(0, Math.min(255, value)) : 0;
  });

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
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
        },
      }),
      prisma.membership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: businessId,
            userId: customerId,
          },
        },
        select: { currentVisits: true, totalVisits: true, lastVisitAt: true },
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

    const walletStyle = (await getTenantWalletStyle(tenant.id)) || defaultTenantWalletStyle(tenant.id);
    const requiredVisits = tenant.requiredVisits ?? 10;
    const currentVisits = membership?.currentVisits ?? 0;
    const remaining = Math.max(0, requiredVisits - currentVisits);
    const objectId = `${issuerId}.${sanitizeIdPart(`${tenant.id}_${user.id}`)}`;

    const account = parseGoogleServiceAccount();

    const textModulesData = [
      {
        id: 'meta-visitas',
        header: 'Meta',
        body: `${currentVisits}/${requiredVisits} visitas`,
      },
      {
        id: 'premio',
        header: 'Tu premio',
        body: tenant.prize || 'Premio sorpresa',
      },
      {
        id: 'restantes',
        header: remaining > 0 ? 'Faltan' : '¡Listo!',
        body: remaining > 0 ? `${remaining} visita${remaining === 1 ? '' : 's'}` : 'Canjea tu premio',
      },
      {
        id: 'periodo',
        header: 'Periodo',
        body: formatPeriodLabel(tenant.rewardPeriod),
      },
      {
        id: 'historial',
        header: 'Historial',
        body: `${membership?.totalVisits ?? 0} visita${(membership?.totalVisits ?? 0) === 1 ? '' : 's'} en total`,
      },
      {
        id: 'ultima-visita',
        header: 'Última visita',
        body: formatDateEs(membership?.lastVisitAt),
      },
      {
        id: 'miembro-desde',
        header: 'Miembro desde',
        body: formatDateEs(user.createdAt),
      },
    ];

    if (tenant.address) {
      textModulesData.push({ id: 'ubicacion', header: 'Ubicación', body: tenant.address });
    }

    if (tenant.instagram) {
      textModulesData.push({ id: 'instagram', header: 'Instagram', body: `@${tenant.instagram.replace(/^@/, '')}` });
    }

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
            barcode: {
              type: 'QR_CODE',
              value: `puntoia://scan/${user.id}`,
              alternateText: 'Escanea en caja para registrar tu visita',
            },
            hexBackgroundColor: rgbToHex(walletStyle.backgroundColor, '#f59e0b'),
            loyaltyPoints: {
              label: 'Visitas',
              balance: {
                int: currentVisits,
              },
            },
            textModulesData,
          },
        ],
      },
    };

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
