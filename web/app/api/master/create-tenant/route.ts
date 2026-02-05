import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, name, slug, username, password } = body;

    // 🔒 Seguridad Maestra
    if (masterPassword !== 'superadmin2026') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!name || !slug || !username || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Crear el negocio en la BD
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        username,
        password
      }
    });

    return NextResponse.json({ success: true, tenant: newTenant });

  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'El Slug o Usuario ya existe' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
