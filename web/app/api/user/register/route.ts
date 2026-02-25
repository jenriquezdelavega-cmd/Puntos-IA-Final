import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashPassword } from '@/app/lib/password';

type RegisterBody = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  gender?: string;
  birthDate?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const password = String(body.password || '').trim();
    const gender = String(body.gender || '').trim();
    const birthDate = body.birthDate;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    let cleanGender = 'Otro';
    if (gender === 'Hombre') cleanGender = 'Hombre';
    if (gender === 'Mujer') cleanGender = 'Mujer';

    let finalDate: Date | null = null;
    if (birthDate) {
      finalDate = new Date(`${birthDate}T12:00:00Z`);
      if (isNaN(finalDate.getTime())) finalDate = null;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashPassword(password),
        gender: cleanGender,
        birthDate: finalDate,
      },
    });

    return NextResponse.json({ id: newUser.id, name: newUser.name });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Teléfono ya registrado' }, { status: 400 });
    }

    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Error interno')
        : 'Error interno';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
