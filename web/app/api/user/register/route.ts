import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📝 RECIBIDO EN REGISTRO:", body); // 👈 Esto nos dirá la verdad en los logs

    const { name, phone, password, gender } = body;

    if (!name || !phone || !password) {
      console.log("❌ Faltan datos obligatorios");
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Verificar duplicados
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      console.log("❌ Usuario ya existe:", phone);
      return NextResponse.json({ error: 'El teléfono ya está registrado' }, { status: 400 });
    }

    // Crear usuario
    console.log("🛠️ Creando usuario con género:", gender);
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: gender || "No especificado",
        points: 0
      }
    });

    console.log("✅ Usuario creado con ID:", newUser.id);
    return NextResponse.json({ id: newUser.id, name: newUser.name, gender: newUser.gender });

  } catch (error: any) {
    console.error("🔥 ERROR CRÍTICO EN REGISTRO:", error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
