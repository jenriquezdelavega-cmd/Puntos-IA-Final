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
          include: { tenant: true } // 👈 ¡Traemos el nombre del negocio!
        }
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Preparamos la lista bonita para el frontend
    const memberships = user.memberships.map(m => ({
      tenantId: m.tenantId,
      name: m.tenant.name,
      points: m.totalVisits * 10
    }));

    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      phone: user.phone, 
      gender: user.gender,
      birthDate: user.birthDate,
      memberships: memberships // 👈 Enviamos la lista completa
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
