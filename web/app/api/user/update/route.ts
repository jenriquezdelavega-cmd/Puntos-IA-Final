import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';

type UpdateUserBody = {
  id?: string;
  name?: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  sessionToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UpdateUserBody;
    const { id, name, email, gender, birthDate, phone, sessionToken } = body;

    const userId = String(id || '').trim();
    if (!userId) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const session = verifyUserSessionToken(String(sessionToken || ''));
    if (session.uid !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let finalDate = undefined;
    if (birthDate) {
      const d = new Date(`${birthDate}T12:00:00Z`);
      if (!isNaN(d.getTime())) finalDate = d;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        gender,
        birthDate: finalDate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message?: string }).message || '');
      if (message.startsWith('sessionToken')) {
        return NextResponse.json({ error: 'Sesión inválida, vuelve a iniciar sesión' }, { status: 401 });
      }
    }

    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Ese teléfono ya está registrado' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
