import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, gender } = body; // 👈 Aseguramos recibir 'gender'

    if (!id) {
      return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });
    }

    // Actualizar en la base de datos
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name: name,
        phone: phone,
        gender: gender // 👈 ¡Aquí está la clave! Guardarlo.
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error: any) {
    console.error("Error actualizando:", error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
