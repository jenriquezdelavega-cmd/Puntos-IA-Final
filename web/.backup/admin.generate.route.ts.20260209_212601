import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId } = body; // 👈 Ahora esperamos el ID del negocio

    if (!tenantId) return NextResponse.json({ error: 'Falta Tenant ID' }, { status: 400 });

    // Generar código
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    const finalCode = `${code.slice(0, 2)}-${code.slice(2)}`;

    // Guardar vinculado al negocio correcto
    const savedCode = await prisma.dailyCode.create({
      data: {
        code: finalCode,
        tenantId: tenantId, // 👈 Vinculación clave
        isActive: true
      }
    });

    return NextResponse.json({ code: savedCode.code });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
