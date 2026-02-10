import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      } as any
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
