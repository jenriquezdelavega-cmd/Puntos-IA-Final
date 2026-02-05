// web/app/api/check-in/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = body.phone?.trim();
    const code = body.code?.trim();

    // YA NO pedimos password aquí para validar

    if (!phone || !code) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Buscar Usuario (o crearlo silenciosamente)
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      // Creamos el usuario con pass por defecto "1234" para que no se rompa
      user = await prisma.user.create({
        data: { phone, password: '1234', name: 'Cliente' }
      });
    }

    // 2. Validar Código (Igual)
    const dailyCode = await prisma.dailyCode.findFirst({
      where: { code: code, isActive: true },
      include: { tenant: true }
    });

    if (!dailyCode) {
      return NextResponse.json({ error: `Código "${code}" inválido` }, { status: 400 });
    }

    // 3. Membresía (Igual)
    let membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId: dailyCode.tenantId, userId: user.id } }
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: { tenantId: dailyCode.tenantId, userId: user.id }
      });
    }

    // 4. Doble Check-in (Igual)
    const existingVisit = await prisma.visit.findUnique({
      where: { membershipId_dailyCodeId: { membershipId: membership.id, dailyCodeId: dailyCode.id } }
    });

    if (existingVisit) {
      return NextResponse.json({ error: '¡Ya registraste visita hoy!' }, { status: 400 });
    }

    // 5. Registrar
    const result = await prisma.$transaction([
      prisma.visit.create({ data: { membershipId: membership.id, dailyCodeId: dailyCode.id } }),
      prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: { increment: 1 }, totalVisits: { increment: 1 } }
      })
    ]);

    return NextResponse.json({
      success: true,
      business: dailyCode.tenant.name,
      visits: result[1].currentVisits
    });

  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
