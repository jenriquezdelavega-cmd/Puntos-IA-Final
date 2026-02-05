import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // Buscar usuario e incluir sus membresías
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        memberships: true // 👈 ¡Traemos las tarjetas de puntos!
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Calcular Puntos Totales (Suma de todas las visitas * 10)
    const totalPoints = user.memberships.reduce((sum, m) => sum + (m.totalVisits * 10), 0);

    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      phone: user.phone, 
      gender: user.gender,
      birthDate: user.birthDate,
      points: totalPoints // 👈 Enviamos la suma real
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
