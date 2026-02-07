import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, tenantId, name, phone, email, username, password, role } = body;

    if (masterPassword !== 'superadmin2026') return NextResponse.json({ error: 'No' }, { status: 401 });

    // Buscar prefijo del negocio
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Negocio no existe' }, { status: 400 });

    // CONCATENAR PREFIJO
    const fullUsername = `${tenant.codePrefix}.${username}`;

    const newUser = await prisma.tenantUser.create({
      data: { tenantId, name, phone, email, password, role, username: fullUsername }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) { return NextResponse.json({ error: 'Usuario duplicado o error' }, { status: 500 }); }
}
