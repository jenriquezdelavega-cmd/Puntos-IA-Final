import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, code } = body;

    const redemption = await prisma.redemption.findFirst({
      where: { tenantId, code, isUsed: false },
      include: { user: true }
    });

    if (!redemption) return NextResponse.json({ error: 'Código inválido' }, { status: 404 });

    // 🛠️ CORRECCIÓN AQUÍ TAMBIÉN
    const membership = await prisma.membership.findUnique({
      where: {
        tenantId_userId: { // 👈 Corregido
          tenantId: tenantId,
          userId: redemption.userId
        }
      }
    });

    if (!membership || membership.totalVisits * 10 < 100) {
      return NextResponse.json({ error: 'Puntos insuficientes' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.membership.update({
        where: { id: membership.id },
        data: { totalVisits: { decrement: 10 } } 
      }),
      prisma.redemption.update({
        where: { id: redemption.id },
        data: { isUsed: true }
      })
    ]);

    return NextResponse.json({ success: true, user: redemption.user.name });

  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
