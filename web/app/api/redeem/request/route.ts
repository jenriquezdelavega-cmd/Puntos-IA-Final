import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🎁 INTENTO CANJE:", body);

    const { userId, tenantId } = body;

    if (!userId || !tenantId) {
       console.log("❌ Faltan datos");
       return NextResponse.json({ error: 'Faltan datos (User o Tenant)' }, { status: 400 });
    }

    // Verificar puntos
    const membership = await prisma.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId } }
    });

    if (!membership) {
        console.log("❌ Membresía no encontrada");
        return NextResponse.json({ error: 'No tienes membresía aquí' }, { status: 400 });
    }

    const points = membership.totalVisits * 10;
    console.log("💰 Puntos actuales:", points);

    if (points < 100) {
      return NextResponse.json({ error: `Solo tienes ${points} puntos. Necesitas 100.` }, { status: 400 });
    }

    // Generar código
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    console.log("📝 Creando Redemption en BD...");
    
    // Guardar
    await prisma.redemption.create({
      data: {
        code,
        userId,
        tenantId,
        isUsed: false
      }
    });

    console.log("✅ Código generado:", code);
    return NextResponse.json({ success: true, code });

  } catch (error: any) {
    console.error("🔥 ERROR CANJE:", error);
    return NextResponse.json({ error: 'Error técnico: ' + error.message }, { status: 500 });
  }
}
