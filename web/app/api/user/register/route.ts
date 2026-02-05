import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password, gender, birthDate } = body;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Nombre, teléfono y contraseña son obligatorios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return NextResponse.json({ error: 'Este teléfono ya está registrado' }, { status: 400 });
    }

    // Convertir fecha de texto (2000-01-01) a Objeto Fecha real
    let finalDate = null;
    if (birthDate) {
      finalDate = new Date(birthDate);
      if (isNaN(finalDate.getTime())) finalDate = null; // Si es fecha inválida, ignorar
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: gender || 'No especificado',
        birthDate: finalDate, // 🎂 ¡Aquí se guarda!
        points: 0
      }
    });

    return NextResponse.json({ id: newUser.id, name: newUser.name });

  } catch (error: any) {
    console.error("Error registro:", error);
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 });
  }
}
