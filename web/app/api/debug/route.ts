import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("🛠️ Reparando Cafetería...");
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'cafeteria-central' },
      update: {},
      create: { name: 'Cafetería Central', slug: 'cafeteria-central' }
    });
    return NextResponse.json({ status: 'ARREGLADO', cafeteria: tenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
