import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';
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
      prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true } }),
      prisma.tenant.findUnique({ where: { id: businessId }, select: { id: true, name: true, requiredVisits: true } }),
      prisma.membership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: businessId,
            userId: customerId,
          },
        },
        select: { currentVisits: true },
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
            barcode: {
              type: 'QR_CODE',
              value: `puntoia://scan/${user.id}`,
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
                id: 'meta-visitas',
                header: 'Meta',
                body: `${membership?.currentVisits ?? 0}/${tenant.requiredVisits} visitas`,
              },
            ],
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
