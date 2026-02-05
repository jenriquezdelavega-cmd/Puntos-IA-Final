import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) return NextResponse.json({ error: 'Falta Tenant ID' }, { status: 400 });

    // 1. Contar Membresías de ESTE negocio
    const memberships = await prisma.membership.findMany({
      where: { tenantId: tenantId },
      include: { user: true }
    });

    const total = memberships.length;

    // 2. Agrupar por género manualmente (ya que gender está en User, no en Membership)
    const stats: Record<string, number> = { 'Hombre': 0, 'Mujer': 0 };
    
    memberships.forEach(m => {
      const g = (m.user.gender || '').toLowerCase();
      if(['hombre','male','m'].includes(g)) stats['Hombre']++;
      else if(['mujer','female','f'].includes(g)) stats['Mujer']++;
    });

    return NextResponse.json({ 
      total: total, 
      breakdown: [
        { gender: 'Hombre', _count: { gender: stats['Hombre'] } },
        { gender: 'Mujer', _count: { gender: stats['Mujer'] } }
      ]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
