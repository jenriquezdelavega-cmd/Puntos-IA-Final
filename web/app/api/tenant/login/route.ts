import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Buscar usuario del negocio
    const user = await prisma.tenantUser.findUnique({
      where: { username },
      include: { tenant: true } // Traemos toda la info del negocio
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
        prize: user.tenant.prize,
        // 🆕 AHORA SÍ ENVIAMOS ESTOS DATOS AL FRONTEND
        instagram: user.tenant.instagram,
        lat: user.tenant.lat,
        lng: user.tenant.lng,
        address: user.tenant.address
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
