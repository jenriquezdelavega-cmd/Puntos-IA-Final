import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, gender, birthDate } = body; // 🆕 email

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
        email, // 🆕 Actualizar email
        gender,
        birthDate: finalDate
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
