import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Array de datos falsos bonitos
    const users = [
      { name: "Carlos Perez", gender: "Hombre" },
      { name: "Maria Gonzalez", gender: "Mujer" },
      { name: "Juan Lopez", gender: "Hombre" },
      { name: "Ana Torres", gender: "Mujer" },
      { name: "Luis Hernandez", gender: "Hombre" },
      { name: "Sofia Ramirez", gender: "Mujer" },
      { name: "Pedro Diaz", gender: "Hombre" },
      { name: "Lucia Fernandez", gender: "Mujer" },
      { name: "Miguel Ruiz", gender: "Hombre" },
      { name: "Elena Gomez", gender: "Mujer" },
      { name: "Alex Morgan", gender: "Otro" },
      { name: "Fernando Solis", gender: "Hombre" }
    ];

    for (const u of users) {
      // Generar teléfono random para que no choque
      const randomPhone = "55" + Math.floor(Math.random() * 100000000);
      
      await prisma.user.create({
        data: {
          name: u.name,
          phone: randomPhone,
          password: "123",
          gender: u.gender,
          birthDate: new Date("1995-01-01T12:00:00Z")
        }
      });
    }

    return NextResponse.json({ success: true, message: "¡12 Usuarios inyectados!" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
