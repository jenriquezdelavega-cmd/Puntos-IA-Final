import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, tenantId, name, phone, email, username, password, role } = body;

    if (masterPassword !== 'superadmin2026') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!tenantId || !username || !password || !role) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const newUser = await prisma.tenantUser.create({
      data: {
        tenantId, name, phone, email, username, password, role
      }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    if(error.code === 'P2002') return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
