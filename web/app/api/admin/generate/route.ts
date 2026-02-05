// web/app/api/admin/generate/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    console.log("🔍 Intentando generar código...");

    // 1. Verificar Password
    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // 2. Buscar si existe la cafetería
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'cafeteria-central' }
    });

    // 🚨 DIAGNÓSTICO: Si no existe, avisar claramente
    if (!tenant) {
      console.error("❌ Error: No se encuentra 'cafeteria-central' en la tabla Tenant");
      return NextResponse.json({ 
        error: 'LA CAFETERÍA NO EXISTE EN LA BASE DE DATOS. Ejecuta el script de reparación (fix.ts).' 
      }, { status: 404 });
    }

    // 3. Generar Código (Letras y Números)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomCode = "";
    for (let i = 0; i < 5; i++) {
      randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Formato: AB-123 (Insertamos guion para que sea legible)
    const formattedCode = `${randomCode.slice(0, 2)}-${randomCode.slice(2)}`;

    // 4. Guardar en la Base de Datos
    const newCode = await prisma.dailyCode.create({
      data: {
        code: formattedCode,
        tenantId: tenant.id,
        isActive: true
      }
    });

    console.log("✅ Código generado exitosamente:", newCode.code);
    return NextResponse.json({ code: newCode.code });

  } catch (error: any) {
    console.error("🔥 ERROR GRAVE:", error);
    return NextResponse.json({ error: `Error técnico: ${error.message}` }, { status: 500 });
  }
}
