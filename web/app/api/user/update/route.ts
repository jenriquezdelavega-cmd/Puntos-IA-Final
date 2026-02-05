// web/app/api/user/update/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone, currentPassword, newPassword, name, gender, birthDate } = await request.json();

    // 1. Verificar credenciales actuales
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || user.password !== currentPassword) {
      return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
    }

    // 2. Preparar datos a actualizar
    const updateData: any = {
      name,
      gender,
      birthDate: birthDate ? new Date(birthDate) : null
    };

    // Solo actualizamos password si el usuario escribió una nueva
    if (newPassword && newPassword.trim() !== '') {
      updateData.password = newPassword;
    }

    // 3. Guardar cambios
    await prisma.user.update({
      where: { phone },
      data: updateData
    });

    return NextResponse.json({ success: true, message: 'Perfil actualizado' });

  } catch (error: any) {
    console.error("Error update:", error);
    return NextResponse.json({ error: error.message || 'Error al actualizar' }, { status: 500 });
  }
}
