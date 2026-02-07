import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, action, userId, data } = body;

    if (masterPassword !== 'superadmin2026') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (action === 'DELETE') {
      await prisma.tenantUser.delete({ where: { id: userId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE') {
      const updated = await prisma.tenantUser.update({
        where: { id: userId },
        data: { 
            name: data.name, 
            username: data.username, 
            password: data.password, // En prod encriptaríamos esto
            role: data.role,
            phone: data.phone,
            email: data.email
        }
      });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
