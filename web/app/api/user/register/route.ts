// web/app/api/user/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { phone, password, name } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Verificar si ya existe
    const existingUser = await prisma.user.findUnique({ where: { phone } });

    if (existingUser) {
      // Si ya existe (porque hizo check-in antes), avisamos
      return NextResponse.json({ 
        error: 'Este teléfono ya está registrado. Intenta entrar con "1234" o tu clave.' 
      }, { status: 409 });
    }

    // 2. Crear Usuario Nuevo
    const newUser = await prisma.user.create({
      data: {
        phone,
        password,
        name: name || 'Cliente Nuevo'
      }
    });

    return NextResponse.json({ success: true, message: 'Cuenta creada exitosamente' });

  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 });
  }
}
