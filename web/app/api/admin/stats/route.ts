import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, tenantUserId, tenantSessionToken } = body;

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    // 1. Contar Membresías de ESTE negocio
    const memberships = await prisma.membership.findMany({
      where: { tenantId: access.tenantId },
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

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
