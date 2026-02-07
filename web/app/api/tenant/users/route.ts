import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// LISTAR EMPLEADOS
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const users = await prisma.tenantUser.findMany({
      where: { tenantId },
      orderBy: { role: 'asc' } // Primero ADMIN, luego STAFF
    });

    return NextResponse.json({ users });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

// CREAR EMPLEADO
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, name, username, password, role, phone, email } = body;

    if (!tenantId || !username || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const newUser = await prisma.tenantUser.create({
      data: {
        tenantId,
        name,
        username,
        password,
        role: role || 'STAFF', // Default STAFF
        phone: phone || '',
        email: email || ''
      }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// BORRAR EMPLEADO
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    await prisma.tenantUser.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
