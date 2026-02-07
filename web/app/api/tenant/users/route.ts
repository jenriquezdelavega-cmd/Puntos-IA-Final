import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    const users = await prisma.tenantUser.findMany({ where: { tenantId }, orderBy: { role: 'asc' } });
    return NextResponse.json({ users });
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, name, username, password, role, phone, email } = body;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Negocio inválido' }, { status: 400 });

    // 🛡️ FALLBACK: Si no tiene prefijo, usa el slug o "OLD"
    const prefix = tenant.codePrefix || tenant.slug.substring(0,4).toUpperCase();
    const fullUsername = `${prefix}.${username}`;

    const newUser = await prisma.tenantUser.create({
      data: { tenantId, name, password, role: role||'STAFF', phone: phone||'', email: email||'', username: fullUsername }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    if(error.code==='P2002') return NextResponse.json({ error: 'Usuario ya existe' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try { const body = await request.json(); await prisma.tenantUser.delete({ where: { id: body.id } }); return NextResponse.json({ success: true }); } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
