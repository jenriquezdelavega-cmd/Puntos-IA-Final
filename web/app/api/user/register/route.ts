cat <<EOF > app/api/user/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 👇 AQUÍ ESTABA EL DETALLE: Agregamos 'gender' a la lista
    const { name, phone, password, gender } = body;

    // Validaciones básicas
    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Verificar si ya existe el teléfono
    const existingUser = await prisma.user.findUnique({
      where: { phone: phone }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este teléfono ya está registrado' }, { status: 400 });
    }

    // Crear usuario CON GÉNERO
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: gender || "Prefiero no decirlo", // Guardamos el género (o un default)
        points: 0
      }
    });

    return NextResponse.json({ 
      id: newUser.id, 
      name: newUser.name,
      gender: newUser.gender // Devolvemos el dato para confirmar
    });

  } catch (error: any) {
    console.error("Error registro:", error);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}
EOF
