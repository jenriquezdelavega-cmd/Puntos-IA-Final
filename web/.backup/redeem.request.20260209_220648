import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, tenantId } = body;

    if (!userId || !tenantId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // 🛠️ CORRECCIÓN: Usar 'tenantId_userId' en lugar de 'userId_tenantId'
    const membership = await prisma.membership.findUnique({
      where: {
        tenantId_userId: { // 👈 Este es el nombre correcto que Prisma generó
          tenantId: tenantId,
          userId: userId
        }
      }
    });

    if (!membership || membership.totalVisits * 10 < 100) {
      return NextResponse.json({ error: 'No tienes puntos suficientes' }, { status: 400 });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.redemption.create({
      data: { code, userId, tenantId, isUsed: false }
    });

    return NextResponse.json({ success: true, code });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error técnico: ' + error.message }, { status: 500 });
  }
}
