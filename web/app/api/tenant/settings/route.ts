import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getTenantWalletStyle, upsertTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { ensureWalletRegistrationsTable, touchWalletPassRegistrations } from '@/app/lib/apple-wallet-webservice';
import { pushWalletUpdateToDevice, deleteWalletRegistrationsByPushToken } from '@/app/lib/apple-wallet-push';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const {
      tenantId,
      prize,
      requiredVisits,
      rewardPeriod,
      lat,
      lng,
      address,
      instagram,
      logoData,
      walletBackgroundColor,
      walletForegroundColor,
      walletLabelColor,
      walletStripImageData,
    } = body;

    if (!tenantId) return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });

    const parsedVisits =
      requiredVisits === undefined || requiredVisits === null || requiredVisits === ''
        ? undefined
        : Math.max(1, parseInt(String(requiredVisits), 10));

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(prize !== undefined ? { prize } : {}),
        ...(instagram !== undefined ? { instagram } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(lat !== undefined && lat !== null && lat !== '' ? { lat: parseFloat(String(lat)) } : {}),
        ...(lng !== undefined && lng !== null && lng !== '' ? { lng: parseFloat(String(lng)) } : {}),
        ...(parsedVisits !== undefined ? { requiredVisits: parsedVisits } : {}),
        ...(rewardPeriod !== undefined ? { rewardPeriod } : {}),
        ...(logoData !== undefined ? { logoData } : {}),
      }
    });

    await upsertTenantWalletStyle({
      tenantId,
      backgroundColor: walletBackgroundColor as string | undefined,
      foregroundColor: walletForegroundColor as string | undefined,
      labelColor: walletLabelColor as string | undefined,
      stripImageData: walletStripImageData as string | null | undefined,
    });

    const walletStyle = await getTenantWalletStyle(tenantId);

    try {
      const passTypeIdentifier = String(process.env.APPLE_PASS_TYPE_ID || '').trim();
      if (passTypeIdentifier) {
        await ensureWalletRegistrationsTable(prisma);
        const regs = await prisma.$queryRawUnsafe<Array<{ push_token: string; serial_number: string }>>(
          `SELECT DISTINCT push_token, serial_number FROM apple_wallet_registrations WHERE serial_number LIKE $1 AND pass_type_identifier = $2`,
          `%-${tenantId}`, passTypeIdentifier
        );

        for (const reg of regs) {
          await touchWalletPassRegistrations(prisma, { serialNumber: reg.serial_number, passTypeIdentifier });
        }

        const seen = new Set<string>();
        for (const reg of regs) {
          const token = String(reg.push_token || '').trim();
          if (!token || seen.has(token)) continue;
          seen.add(token);
          const result = await pushWalletUpdateToDevice(token, passTypeIdentifier);
          if (!result.ok && (result.status === 410 || result.status === 400)) {
            await deleteWalletRegistrationsByPushToken(prisma, token);
          }
        }

        logApiEvent('/api/tenant/settings', 'settings_push_sent', { tenantId, devices: seen.size });
      }
    } catch (pushErr) {
      logApiError('/api/tenant/settings#wallet-push', pushErr);
    }

    return NextResponse.json({
      success: true,
      tenant: {
        ...updated,
        walletBackgroundColor: walletStyle?.backgroundColor || null,
        walletForegroundColor: walletStyle?.foregroundColor || null,
        walletLabelColor: walletStyle?.labelColor || null,
        walletStripImageData: walletStyle?.stripImageData || '',
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
