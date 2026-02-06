import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, code } = body;

    // 1. Buscar el código de canje
    const redemption = await prisma.redemption.findFirst({
      where: { tenantId, code, isUsed: false },
      include: { user: true }
    });

    if (!redemption) return NextResponse.json({ error: 'Código inválido o ya usado' }, { status: 404 });

    // 2. Verificar que el usuario AÚN tenga los puntos (Doble check)
    const membership = await prisma.membership.findUnique({
      where: { userId_tenantId: { userId: redemption.userId, tenantId } }
    });

    if (!membership || membership.totalVisits * 10 < 100) {
      return NextResponse.json({ error: 'El usuario ya no tiene puntos suficientes' }, { status: 400 });
    }

    // 3. TRANSACCIÓN FINAL: Restar puntos y marcar usado
    // Restamos 10 visitas (100 puntos)
    await prisma.$transaction([
      prisma.membership.update({
        where: { id: membership.id },
        data: { totalVisits: { decrement: 10 } } // Resta 100 pts
      }),
      prisma.redemption.update({
        where: { id: redemption.id },
        data: { isUsed: true }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      user: redemption.user.name, 
      message: '¡Puntos descontados correctamente!' 
    });

  } catch (error) { return NextResponse.json({ error: 'Error al procesar' }, { status: 500 }); }
}
