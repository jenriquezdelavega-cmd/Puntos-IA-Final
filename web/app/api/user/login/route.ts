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
          include: { tenant: true } // Traemos datos del negocio (incluyendo prize)
        }
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Mapeamos para enviar limpio al frontend
    const memberships = user.memberships.map(m => ({
      tenantId: m.tenantId,
      name: m.tenant.name,
      prize: m.tenant.prize, // 👈 ¡AQUÍ ESTÁ LA CLAVE! Enviamos el premio real
      points: m.totalVisits * 10
    }));

    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      phone: user.phone, 
      email: user.email, // 🆕 Enviamos email
      gender: user.gender,
      birthDate: user.birthDate,
      memberships: memberships 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
