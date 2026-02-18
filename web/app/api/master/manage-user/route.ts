import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { hashPassword, isHashedPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, action, userId, data } = body;

    if (!isValidMasterPassword(masterPassword)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (action === 'DELETE') {
      await prisma.tenantUser.delete({ where: { id: userId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE') {
      const nextPasswordRaw = String(data?.password || '');
      const nextPassword =
        !nextPasswordRaw
          ? undefined
          : isHashedPassword(nextPasswordRaw)
            ? nextPasswordRaw
            : hashPassword(nextPasswordRaw);

      const updated = await prisma.tenantUser.update({
        where: { id: userId },
        data: {
          name: data.name,
          username: data.username,
          password: nextPassword,
          role: data.role,
          phone: data.phone,
          email: data.email,
        },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error inesperado' }, { status: 500 });
  }
}
