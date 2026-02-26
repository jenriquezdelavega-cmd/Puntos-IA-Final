import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

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

    await prisma.user.update({
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
  } catch (error: unknown) {
    // Si el teléfono ya existe en otro usuario, Prisma lanza error P2002
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') return NextResponse.json({ error: 'Ese teléfono ya está registrado' }, { status: 400 });
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
