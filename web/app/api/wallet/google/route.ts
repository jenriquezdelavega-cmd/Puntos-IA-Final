import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import {
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
  try {
    const issuerId = getGoogleWalletIssuerId();

    if (!issuerId) {
      return NextResponse.json(googleWalletConfigErrorResponse(), { status: 500 });
    }

    const url = new URL(req.url);
    const customerId = String(url.searchParams.get('customerId') || '').trim();
    const businessId = String(url.searchParams.get('businessId') || '').trim();

    if (!customerId || !businessId) {
      return NextResponse.json({ error: 'customerId y businessId son requeridos' }, { status: 400 });
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
      return NextResponse.json({ error: 'Cliente o negocio no encontrado' }, { status: 404 });
    }

    const classId = `${issuerId}.puntoia_loyalty`;
    const objectId = `${issuerId}.${sanitizeIdPart(`${tenant.id}_${user.id}`)}`;

    const account = parseGoogleServiceAccount();

    const jwtPayload = {
      iss: account.client_email,
      aud: 'google',
      typ: 'savetowallet',
      payload: {
        loyaltyClasses: [
          {
            id: classId,
            issuerName: 'Punto IA',
            programName: tenant.name,
            programLogo: {
              sourceUri: {
                uri: 'https://www.puntoia.mx/wallet-assets/logo.png',
              },
            },
            hexBackgroundColor: '#f43f5e',
            reviewStatus: 'UNDER_REVIEW',
          },
        ],
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

    return NextResponse.json({
      saveUrl: `https://pay.google.com/gp/v/save/${token}`,
      classId,
      objectId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
