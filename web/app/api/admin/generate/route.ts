// web/app/api/admin/generate/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // 1. Buscar Cafetería
    let tenant = await prisma.tenant.findUnique({
      where: { slug: 'cafeteria-central' }
    });

    // 🚨 AUTO-REPARACIÓN: Si no existe, ¡LA CREAMOS AQUÍ MISMO!
    if (!tenant) {
      console.log("⚠️ Cafetería no encontrada. Creándola automáticamente...");
      try {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Cafetería Central',
            slug: 'cafeteria-central'
          }
        });
        console.log("✅ Cafetería creada con éxito.");
      } catch (createError) {
        console.error("❌ Error al crear cafetería:", createError);
        return NextResponse.json({ error: 'Error crítico creando el negocio' }, { status: 500 });
      }
    }

    // 2. Generar Código
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 5; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const formattedCode = `${randomCode.slice(0, 2)}-${randomCode.slice(2)}`;

    // 3. Guardar
    const newCode = await prisma.dailyCode.create({
      data: {
        code: formattedCode,
        tenantId: tenant.id,
        isActive: true
      }
    });

    return NextResponse.json({ code: newCode.code });

  } catch (error: any) {
    console.error("🔥 Error:", error);
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 });
  }
}
