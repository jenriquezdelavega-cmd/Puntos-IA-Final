import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Buscar negocio por usuario
    const tenant = await prisma.tenant.findUnique({
      where: { username: username }
    });

    if (!tenant || tenant.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Devolvemos el ID del negocio para que el frontend sepa quién es
    return NextResponse.json({ 
      success: true, 
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
