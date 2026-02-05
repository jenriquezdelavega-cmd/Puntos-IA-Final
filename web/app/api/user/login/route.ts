import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Buscar usuario por teléfono
    const user = await prisma.user.findUnique({
      where: { phone: phone }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar contraseña (en un caso real usaríamos hash, aquí es simple)
    if (user.password !== password) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // ¡ÉXITO! Devolvemos los datos clave (incluyendo ID y Gender)
    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      phone: user.phone, 
      gender: user.gender,
      points: user.points 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
