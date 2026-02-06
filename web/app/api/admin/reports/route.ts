import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) return NextResponse.json({ error: 'Falta Tenant ID' }, { status: 400 });

    // 1. OBTENER TODAS LAS VISITAS (Para gráfica)
    // Buscamos visitas de este negocio
    const visits = await prisma.visit.findMany({
      where: {
        membership: { tenantId: tenantId }
      },
      include: {
        membership: {
          include: { user: true }
        }
      },
      orderBy: { visitedAt: 'asc' }
    });

    // Agrupar visitas por fecha (YYYY-MM-DD)
    const visitsByDate: Record<string, number> = {};
    visits.forEach(v => {
      const date = v.visitedAt.toISOString().split('T')[0];
      visitsByDate[date] = (visitsByDate[date] || 0) + 1;
    });

    // Formatear para gráfica
    const chartData = Object.keys(visitsByDate).map(date => ({
      date,
      count: visitsByDate[date]
    }));

    // 2. OBTENER CLIENTES (Para Excel)
    // Lista plana de usuarios con sus puntos
    const memberships = await prisma.membership.findMany({
      where: { tenantId: tenantId },
      include: { user: true }
    });

    const csvData = memberships.map(m => ({
      Nombre: m.user.name || 'Anónimo',
      Telefono: m.user.phone,
      Email: m.user.email || '',
      Genero: m.user.gender || '',
      VisitasTotales: m.totalVisits,
      UltimaVisita: m.lastVisitAt ? m.lastVisitAt.toISOString().split('T')[0] : 'N/A'
    }));

    return NextResponse.json({ 
      chartData, 
      csvData 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
