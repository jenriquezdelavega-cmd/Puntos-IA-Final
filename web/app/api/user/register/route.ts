import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password, gender, birthDate } = body;

    if (!name || !phone || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    let finalDate = null;
    if (birthDate) {
      finalDate = new Date(birthDate + "T12:00:00Z");
      if (isNaN(finalDate.getTime())) finalDate = null;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: gender || 'No especificado',
        birthDate: finalDate
        // ❌ ¡AQUÍ ESTABA EL ERROR! Borramos 'points: 0'
      }
    });

    return NextResponse.json({ id: newUser.id, name: newUser.name });

  } catch (error: any) {
    console.error("Error:", error);
    if (error.code === 'P2002') return NextResponse.json({ error: 'Teléfono duplicado' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
