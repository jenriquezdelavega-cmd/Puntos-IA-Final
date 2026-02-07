import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, gender, birthDate, phone } = body; // 🆕 phone

    if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    let finalDate = undefined;
    if (birthDate) {
        const d = new Date(birthDate + "T12:00:00Z");
        if (!isNaN(d.getTime())) finalDate = d;
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name,
        email,
        phone, // 🆕 Actualizar teléfono
        gender,
        birthDate: finalDate
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Si el teléfono ya existe en otro usuario, Prisma lanza error P2002
    if (error.code === 'P2002') return NextResponse.json({ error: 'Ese teléfono ya está registrado' }, { status: 400 });
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
