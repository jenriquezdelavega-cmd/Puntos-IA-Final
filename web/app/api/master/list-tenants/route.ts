import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.masterPassword !== 'superadmin2026') return NextResponse.json({ error: 'No' }, { status: 401 });
    
    const tenants = await prisma.tenant.findMany({
        include: { users: true } // Ver usuarios existentes
    });
    return NextResponse.json({ tenants });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
