import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Password incorrecto' }, { status: 401 });
    }

    // Buscamos la cafetería (que YA sabemos que existe gracias al debug)
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'cafeteria-central' }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Error grave: Cafetería no encontrada' }, { status: 404 });
    }

    // Generar código simple
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
    console.error(error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
