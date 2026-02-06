import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, prize, lat, lng, address } = body; // 🆕 Nuevos campos

    if (!tenantId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        prize: prize,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        address: address
      }
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
