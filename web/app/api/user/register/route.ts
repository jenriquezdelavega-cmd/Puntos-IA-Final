import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password, gender } = body;

    // Validación simple
    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return NextResponse.json({ error: 'Teléfono ya existe' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: gender || 'No especificado',
        points: 0
      }
    });

    return NextResponse.json({ id: newUser.id, name: newUser.name });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
