import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    console.log("📸 CHECK-IN INTENTO:", { userId, code });

    if (!userId || !code) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // 1. Buscar Código
    const validCode = await prisma.dailyCode.findFirst({
      where: { code: code, isActive: true },
      include: { tenant: true }
    });

    if (!validCode) {
      console.log("❌ Código inválido:", code);
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 404 });
    }

    // 2. Verificar duplicado hoy
    const existingCheckin = await prisma.checkIn.findFirst({
      where: { userId: userId, dailyCodeId: validCode.id }
    });

    if (existingCheckin) {
      console.log("⚠️ Ya hizo check-in hoy");
      return NextResponse.json({ error: '¡Ya hiciste check-in hoy!' }, { status: 400 });
    }

    console.log("🛠️ Registrando check-in...");

    // 3. Crear registro Check-in
    await prisma.checkIn.create({
      data: {
        userId: userId,
        tenantId: validCode.tenantId,
        dailyCodeId: validCode.id,
        pointsEarned: 10
      }
    });

    console.log("🛠️ Actualizando Membresía...");

    // 4. Actualizar Membresía (Upsert)
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

    console.log("✅ ÉXITO! Puntos actuales:", membership.points);

    return NextResponse.json({ 
      success: true, 
      points: membership.points, 
      message: `¡+10 Puntos en ${validCode.tenant.name}!` 
    });

  } catch (error: any) {
    console.error("🔥 ERROR CHECK-IN:", error);
    return NextResponse.json({ error: 'Error técnico: ' + error.message }, { status: 500 });
  }
}
// Forzar rebuild
