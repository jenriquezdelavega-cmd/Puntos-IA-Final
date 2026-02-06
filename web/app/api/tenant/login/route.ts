import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Buscar en la tabla de empleados
    const user = await prisma.tenantUser.findUnique({
      where: { username },
      include: { tenant: true }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        name: user.name,
        role: user.role
      },
      tenant: { 
        id: user.tenant.id, 
        name: user.tenant.name, 
        slug: user.tenant.slug,
        prize: user.tenant.prize
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
