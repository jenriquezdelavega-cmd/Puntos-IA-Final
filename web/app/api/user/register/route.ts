import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, password, gender, birthDate } = body; // 🆕 email

    if (!name || !phone || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // Limpieza Género
    let cleanGender = 'Otro';
    if (gender === 'Hombre') cleanGender = 'Hombre';
    if (gender === 'Mujer') cleanGender = 'Mujer';

    // Fecha
    let finalDate = null;
    if (birthDate) {
      finalDate = new Date(birthDate + "T12:00:00Z");
      if (isNaN(finalDate.getTime())) finalDate = null;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null, // 🆕 Guardar email
        password,
        gender: cleanGender,
        birthDate: finalDate
      }
    });

    return NextResponse.json({ id: newUser.id, name: newUser.name });

  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Teléfono ya registrado' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
