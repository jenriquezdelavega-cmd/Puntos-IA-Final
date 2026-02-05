import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    console.log("📸 Escaneo recibido:", { userId, code });

    if (!userId || !code) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Buscar el código en la base de datos
    const validCode = await prisma.dailyCode.findFirst({
      where: { 
        code: code,
        isActive: true
        // Podríamos agregar validación de fecha aquí si quisieras
      },
      include: { tenant: true }
    });

    if (!validCode) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 404 });
    }

    // 2. Verificar si el usuario ya hizo check-in HOY con este código
    // (Para que no sume puntos infinitos escaneando lo mismo)
    const existingCheckin = await prisma.checkIn.findFirst({
      where: {
        userId: userId,
        dailyCodeId: validCode.id
      }
    });

    if (existingCheckin) {
      return NextResponse.json({ error: '¡Ya hiciste check-in hoy!' }, { status: 400 });
    }

    // 3. Registrar el Check-in
    await prisma.checkIn.create({
      data: {
        userId: userId,
        tenantId: validCode.tenantId,
        dailyCodeId: validCode.id,
        pointsEarned: 10 // Sumamos 10 puntos por visita
      }
    });

    // 4. Buscar o Crear Membresía y Sumar Puntos
    // (Como quitamos 'points' de User, ahora todo va en Membership)
    const membership = await prisma.membership.upsert({
      where: {
        userId_tenantId: {
          userId: userId,
          tenantId: validCode.tenantId
        }
      },
      update: {
        points: { increment: 10 },
        visits: { increment: 1 },
        lastVisit: new Date()
      },
      create: {
        userId: userId,
        tenantId: validCode.tenantId,
        points: 10,
        visits: 1,
        lastVisit: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      points: membership.points, 
      message: `¡+10 Puntos en ${validCode.tenant.name}!` 
    });

  } catch (error: any) {
    console.error("Error Check-in:", error);
    return NextResponse.json({ error: 'Error al procesar check-in' }, { status: 500 });
  }
}
