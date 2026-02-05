// web/app/api/debug/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("🛠️ Iniciando reparación manual...");

    // Crear Cafetería
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'cafeteria-central' },
      update: {},
      create: {
        name: 'Cafetería Central',
        slug: 'cafeteria-central'
      }
    });

    // Crear un Código de prueba
    const code = await prisma.dailyCode.create({
      data: {
        code: 'TEST-999',
        tenantId: tenant.id,
        isActive: true
      }
    });

    return NextResponse.json({ 
      status: 'ÉXITO', 
      message: 'Cafetería creada y código de prueba generado.',
      cafeteria: tenant,
      codigo_prueba: code
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
