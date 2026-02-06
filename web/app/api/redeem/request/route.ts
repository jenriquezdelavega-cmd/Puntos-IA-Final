import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, tenantId } = body;

    // Verificar puntos
    const membership = await prisma.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId } }
    });

    if (!membership || membership.totalVisits * 10 < 100) {
      return NextResponse.json({ error: 'No tienes puntos suficientes' }, { status: 400 });
    }

    // Generar código corto aleatorio (ej: 4821)
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Guardar intención de canje
    await prisma.redemption.create({
      data: {
        code,
        userId,
        tenantId,
        isUsed: false
      }
    });

    return NextResponse.json({ success: true, code });

  } catch (error) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
