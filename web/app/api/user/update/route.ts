import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📝 UPDATE RECIBIDO:", body); // Logs para debug

    const { id, name, phone, gender } = body;

    if (!id) {
      console.log("❌ Falta ID");
      return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });
    }

    // Actualizar
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name: name,
        gender: gender // Aquí se guarda
      }
    });

    console.log("✅ Usuario actualizado:", updatedUser.name);
    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error("🔥 Error Update:", error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
