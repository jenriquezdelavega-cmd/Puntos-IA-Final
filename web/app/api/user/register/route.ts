import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📝 RECIBIDO:", body);

    const { name, phone, password, gender } = body;

    // Validar datos
    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Verificar duplicados
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return NextResponse.json({ error: 'Este teléfono ya está registrado' }, { status: 400 });
    }

    // 🛠️ CORRECCIÓN: Quitamos 'points: 0' porque eso va en la Membresía
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: gender || 'No especificado'
      }
    });

    console.log("✅ Usuario creado con éxito:", newUser.id);
    return NextResponse.json({ id: newUser.id, name: newUser.name, gender: newUser.gender });

  } catch (error: any) {
    console.error("🔥 ERROR:", error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
