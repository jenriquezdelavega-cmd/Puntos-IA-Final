// web/app/api/redeem/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // AHORA pedimos el password aquí
    const { phone, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'cafeteria-central' } });

    const membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId: tenant!.id, userId: user.id } }
    });

    if (!membership || membership.currentVisits < 10) {
      return NextResponse.json({ error: 'Puntos insuficientes' }, { status: 400 });
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: { currentVisits: { decrement: 10 } } 
    });

    return NextResponse.json({ success: true, message: 'Canje exitoso' });

  } catch (error) {
    return NextResponse.json({ error: 'Error al canjear' }, { status: 500 });
  }
}
