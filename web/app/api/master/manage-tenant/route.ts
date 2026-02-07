import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, action, tenantId, data } = body;

    if (masterPassword !== 'superadmin2026') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (action === 'DELETE') {
      await prisma.tenant.delete({ where: { id: tenantId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE') {
      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: { 
            name: data.name, 
            slug: data.slug, 
            prize: data.prize, 
            instagram: data.instagram,
            isActive: data.isActive // 🆕 Actualizar estado
        }
      });
      return NextResponse.json({ success: true, tenant: updated });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
