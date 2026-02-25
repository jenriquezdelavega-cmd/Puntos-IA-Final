import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { isValidMasterPassword } from '@/app/lib/master-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isValidMasterPassword(body.masterPassword)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenants = await prisma.tenant.findMany({
      include: { users: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ tenants });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
