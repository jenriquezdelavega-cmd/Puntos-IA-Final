import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || '').trim();
    const password = String(body?.password || '');

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciales incompletas' }, { status: 400 });
    }

    const user = await prisma.tenantUser.findUnique({
      where: { username },
      include: { tenant: true },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (!isHashedPassword(user.password)) {
      await prisma.tenantUser.update({
        where: { id: user.id },
        data: { password: hashPassword(password) },
      });
    }

    if (user.tenant.isActive === false) {
      return NextResponse.json({ error: 'Este negocio ha sido suspendido. Contacta a soporte.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        prize: user.tenant.prize,
        instagram: user.tenant.instagram,
        lat: user.tenant.lat,
        lng: user.tenant.lng,
        address: user.tenant.address,
        requiredVisits: user.tenant.requiredVisits,
        rewardPeriod: user.tenant.rewardPeriod,
        logoData: user.tenant.logoData,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
