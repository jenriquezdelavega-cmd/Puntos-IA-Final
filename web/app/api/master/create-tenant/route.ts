import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, name, slug } = body;

    if (!isValidMasterPassword(masterPassword)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!name || !slug) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const prefix = name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 99).toString();

    const newTenant = await prisma.tenant.create({
      data: { name, slug, codePrefix: prefix },
    });

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Slug o Prefijo duplicado' }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
