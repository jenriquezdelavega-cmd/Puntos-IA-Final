import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, gender, birthDate } = body;

    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    // Procesar fecha
    let finalDate = undefined;
    if (birthDate) {
        const d = new Date(birthDate);
        if (!isNaN(d.getTime())) finalDate = d;
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name: name,
        gender: gender,
        birthDate: finalDate // 🎂 Guardamos el cambio
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
