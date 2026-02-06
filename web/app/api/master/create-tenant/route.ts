import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, name, slug } = body;

    // 🔒 Seguridad Maestra
    if (masterPassword !== 'superadmin2026') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!name || !slug) {
      return NextResponse.json({ error: 'Faltan datos (Nombre o Slug)' }, { status: 400 });
    }

    // Crear el negocio (Sin usuario/pass, eso se crea aparte ahora)
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        username: null, // Dejamos esto limpio para evitar errores de duplicados
        password: null
      }
    });

    return NextResponse.json({ success: true, tenant: newTenant });

  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') return NextResponse.json({ error: 'Ese Slug (URL) ya existe, usa otro.' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
