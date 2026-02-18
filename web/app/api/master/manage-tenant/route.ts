import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, action, tenantId, data } = body;

    if (!isValidMasterPassword(masterPassword)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

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
          isActive: data.isActive,
        },
      });
      return NextResponse.json({ success: true, tenant: updated });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado' },
      { status: 500 }
    );
  }
}
