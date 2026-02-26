import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) return NextResponse.json({ error: 'Falta Tenant ID' }, { status: 400 });

    // 1. VISITAS
    const visits = await prisma.visit.findMany({
      where: { membership: { tenantId } },
      orderBy: { visitedAt: 'asc' }
    });

    const visitsByDate: Record<string, number> = {};
    visits.forEach(v => {
      const date = v.visitedAt.toISOString().split('T')[0];
      visitsByDate[date] = (visitsByDate[date] || 0) + 1;
    });
    const chartData = Object.keys(visitsByDate).map(d => ({ date: d, count: visitsByDate[d] }));

    // 2. DEMOGRAFÍA
    const memberships = await prisma.membership.findMany({
      where: { tenantId },
      include: { user: true }
    });

    let male = 0, female = 0, other = 0;
    
    // 🆕 NUEVOS RANGOS DE EDAD
    const ages = { '<18': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-65': 0, '>65': 0 };

    memberships.forEach(m => {
      // Género
      const g = (m.user.gender || '').toLowerCase();
      if (g === 'hombre' || g === 'm') male++;
      else if (g === 'mujer' || g === 'f') female++;
      else other++;

      // Edad
      if (m.user.birthDate) {
        const birth = new Date(m.user.birthDate);
        const age = new Date().getFullYear() - birth.getFullYear();
        
        if (age < 18) ages['<18']++;
        else if (age >= 18 && age <= 25) ages['18-25']++;
        else if (age >= 26 && age <= 35) ages['26-35']++;
        else if (age >= 36 && age <= 45) ages['36-45']++;
        else if (age >= 46 && age <= 65) ages['46-65']++;
        else if (age > 65) ages['>65']++;
      }
    });

    const genderData = [
      { label: 'Hombres', value: male, color: '#3b82f6' },
      { label: 'Mujeres', value: female, color: '#ec4899' },
      { label: 'Otros', value: other, color: '#9ca3af' }
    ];

    const ageData = Object.keys(ages).map(k => ({ label: k, value: ages[k as keyof typeof ages] }));

    // CSV
    const csvData = memberships.map(m => ({
      Nombre: m.user.name || 'Anónimo',
      Telefono: m.user.phone,
      Email: m.user.email || '',
      Genero: m.user.gender || '',
      Visitas: m.totalVisits,
      Ultima: m.lastVisitAt ? m.lastVisitAt.toISOString().split('T')[0] : '-'
    }));

    return NextResponse.json({ chartData, genderData, ageData, csvData });

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
