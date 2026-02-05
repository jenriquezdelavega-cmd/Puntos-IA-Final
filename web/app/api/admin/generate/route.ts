import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 🛡️ PROTECCIÓN CONTRA JSON VACÍO
    let password = "";
    try {
      const text = await request.text(); // Leemos texto crudo primero
      if (text) {
        const body = JSON.parse(text);
        password = body.password;
      }
    } catch (e) {
      console.log("⚠️ Petición vacía recibida");
    }

    // Verificación
    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Contraseña incorrecta o no recibida' }, { status: 401 });
    }

    // Buscar Cafetería
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'cafeteria-central' }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Cafetería no encontrada (usa /api/debug primero)' }, { status: 404 });
    }

    // Generar
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    const finalCode = `${code.slice(0, 2)}-${code.slice(2)}`;

    // Guardar
    const savedCode = await prisma.dailyCode.create({
      data: {
        code: finalCode,
        tenantId: tenant.id,
        isActive: true
      }
    });

    return NextResponse.json({ code: savedCode.code });

  } catch (error: any) {
    console.error("🔥 Error:", error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
