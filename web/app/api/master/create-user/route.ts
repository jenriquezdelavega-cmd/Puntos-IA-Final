import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { hashPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, tenantId, name, phone, email, username, password, role } = body;

    if (!isValidMasterPassword(masterPassword)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Negocio no existe' }, { status: 400 });

    const rawPassword = String(password || '');
    if (!rawPassword) {
      return NextResponse.json({ error: 'Password requerido' }, { status: 400 });
    }

    const prefix = tenant.codePrefix || tenant.slug.substring(0, 4).toUpperCase();
    const fullUsername = `${prefix}.${username}`;

    const newUser = await prisma.tenantUser.create({
      data: {
        tenantId,
        name,
        phone,
        email,
        password: hashPassword(rawPassword),
        role,
        username: fullUsername,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch {
    return NextResponse.json({ error: 'Usuario duplicado o error' }, { status: 500 });
  }
}
