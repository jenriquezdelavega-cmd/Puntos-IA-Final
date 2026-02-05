import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.password !== 'admin123') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const totalUsers = await prisma.user.count();
    const genderStats = await prisma.user.groupBy({
      by: ['gender'],
      _count: { gender: true },
    });
    return NextResponse.json({ total: totalUsers, breakdown: genderStats });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
