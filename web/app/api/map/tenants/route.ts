import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Solo traemos lo necesario para el mapa
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        address: true,
        prize: true
      }
    });
    return NextResponse.json({ tenants });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
