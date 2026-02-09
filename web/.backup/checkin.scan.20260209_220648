import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const day = todayKeyUTC();

    // 1) Buscar el código (activo y del día)
    const validCode = await prisma.dailyCode.findFirst({
      where: { code, isActive: true, day },
      include: { tenant: true },
    });

    if (!validCode) {
      return NextResponse.json({ error: 'Código inválido o no es de hoy' }, { status: 404 });
    }

    // 2) Buscar o crear membresía
    let membership = await prisma.membership.findFirst({
      where: { userId, tenantId: validCode.tenantId },
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: { userId, tenantId: validCode.tenantId, currentVisits: 0, totalVisits: 0 },
      });
    }

    // 3) Bloqueo anti-duplicado por día/negocio (aunque existan muchos códigos hoy)
    const alreadyToday = await prisma.visit.findFirst({
      where: { membershipId: membership.id, tenantId: validCode.tenantId, visitDay: day },
    });

    if (alreadyToday) {
      return NextResponse.json({ error: '¡Ya registraste tu visita hoy!' }, { status: 400 });
    }

    // 4) Registrar visita + actualizar contadores
    const [, updatedMembership] = await prisma.$transaction([
      prisma.visit.create({
        data: {
          membershipId: membership.id,
          dailyCodeId: validCode.id,
          tenantId: validCode.tenantId,
          visitDay: day,
        },
      }),
      prisma.membership.update({
        where: { id: membership.id },
        data: {
          currentVisits: { increment: 1 },
          totalVisits: { increment: 1 },
          lastVisitAt: new Date(),
        },
      }),
    ]);

    const pointsDisplay = updatedMembership.totalVisits * 10;

    return NextResponse.json({
      success: true,
      points: pointsDisplay,
      message: `¡Visita registrada en ${validCode.tenant.name}!`,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error técnico' }, { status: 500 });
  }
}
