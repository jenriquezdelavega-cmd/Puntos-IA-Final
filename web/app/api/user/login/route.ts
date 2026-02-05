import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      phone: user.phone, 
      gender: user.gender,
      birthDate: user.birthDate, // 🎂 ¡Ahora sí la enviamos!
      points: user.points 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
