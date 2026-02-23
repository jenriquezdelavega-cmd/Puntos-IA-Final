import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTenantWalletStyle, upsertTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
const prisma = new PrismaClient();

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

    await upsertTenantWalletStyle(prisma, {
      tenantId,
      backgroundColor: walletBackgroundColor,
      foregroundColor: walletForegroundColor,
      labelColor: walletLabelColor,
      stripImageData: walletStripImageData,
    });

    const walletStyle = await getTenantWalletStyle(prisma, tenantId);

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
