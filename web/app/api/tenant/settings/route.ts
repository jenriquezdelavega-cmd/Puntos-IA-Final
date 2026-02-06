import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, prize } = body;
    if (!tenantId || !prize) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { prize: prize }
    });

    return NextResponse.json({ success: true, prize: updated.prize });
  } catch (error) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
