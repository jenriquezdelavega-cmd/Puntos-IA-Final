import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        memberships: {
          include: { tenant: true }
        }
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const memberships = user.memberships.map(m => ({
      tenantId: m.tenantId,
      name: m.tenant.name,
      prize: m.tenant.prize,
      instagram: m.tenant.instagram, // 🆕 AHORA ENVIAMOS EL IG
      points: m.totalVisits * 10
    }));

    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      phone: user.phone, 
      email: user.email, 
      gender: user.gender,
      birthDate: user.birthDate,
      memberships: memberships 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
