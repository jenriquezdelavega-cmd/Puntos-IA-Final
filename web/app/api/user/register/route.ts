import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, password, gender, birthDate } = body;

    if (!name || !phone || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // 🛡️ LIMPIEZA DE GÉNERO (Blindaje)
    // Solo permitimos estos 3 valores exactos. Si llega otra cosa, se pone 'Otro'.
    const validGenders = ['Hombre', 'Mujer', 'Otro'];
    let cleanGender = gender;
    
    // Normalización
    if (gender === 'Male' || gender === 'M') cleanGender = 'Hombre';
    if (gender === 'Female' || gender === 'F') cleanGender = 'Mujer';
    
    // Si no es válido, default a Otro
    if (!validGenders.includes(cleanGender)) {
        cleanGender = 'Otro';
    }

    // Procesar fecha
    let finalDate = null;
    if (birthDate) {
      finalDate = new Date(birthDate + "T12:00:00Z");
      if (isNaN(finalDate.getTime())) finalDate = null;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: cleanGender, // Usamos el género limpio
        birthDate: finalDate
      }
    });

    return NextResponse.json({ id: newUser.id, name: newUser.name });

  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Teléfono duplicado' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
