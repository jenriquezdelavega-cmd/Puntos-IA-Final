import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Seguridad básica
    if (body.password !== 'admin123') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Contar total de usuarios
    const totalUsers = await prisma.user.count();

    // 2. Agrupar por género
    // Esto devuelve algo como: [{ gender: 'Hombre', _count: 5 }, { gender: 'Mujer', _count: 3 }]
    const genderStats = await prisma.user.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
    });

    return NextResponse.json({ 
      total: totalUsers, 
      breakdown: genderStats 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
