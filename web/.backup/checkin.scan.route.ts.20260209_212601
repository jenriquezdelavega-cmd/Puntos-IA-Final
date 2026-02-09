import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    console.log("📸 Procesando escaneo:", { userId, code });

    if (!userId || !code) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // 1. Buscar el Código Diario
    const validCode = await prisma.dailyCode.findFirst({
      where: { code: code, isActive: true },
      include: { tenant: true }
    });

    if (!validCode) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 });
    }

    // 2. Buscar o Crear la Membresía del Usuario con este Negocio
    // (Usamos findFirst porque tu schema tiene @@unique([tenantId, userId]))
    let membership = await prisma.membership.findFirst({
      where: {
        userId: userId,
        tenantId: validCode.tenantId
      }
    });

    if (!membership) {
      console.log("🆕 Creando nueva membresía...");
      membership = await prisma.membership.create({
        data: {
          userId: userId,
          tenantId: validCode.tenantId,
          currentVisits: 0,
          totalVisits: 0
        }
      });
    }

    // 3. Verificar si ya visitó hoy con este código
    // (Buscamos en la tabla 'Visit')
    const existingVisit = await prisma.visit.findFirst({
      where: {
        membershipId: membership.id,
        dailyCodeId: validCode.id
      }
    });

    if (existingVisit) {
      return NextResponse.json({ error: '¡Ya registraste esta visita hoy!' }, { status: 400 });
    }

    // 4. Registrar la Visita y Actualizar Contadores
    // Usamos una transacción para que se haga todo junto
    const [newVisit, updatedMembership] = await prisma.$transaction([
      // Crear Visita
      prisma.visit.create({
        data: {
          membershipId: membership.id,
          dailyCodeId: validCode.id
        }
      }),
      // Sumar visitas a la membresía
      prisma.membership.update({
        where: { id: membership.id },
        data: {
          currentVisits: { increment: 1 },
          totalVisits: { increment: 1 },
          lastVisitAt: new Date()
        }
      })
    ]);

    // 5. Calcular Puntos (Asumimos 1 Visita = 10 Puntos para mostrarlo bonito)
    const pointsDisplay = updatedMembership.totalVisits * 10;

    return NextResponse.json({ 
      success: true, 
      points: pointsDisplay, 
      message: `¡Visita registrada en ${validCode.tenant.name}!` 
    });

  } catch (error: any) {
    console.error("🔥 Error Scan:", error);
    return NextResponse.json({ error: error.message || 'Error técnico' }, { status: 500 });
  }
}
