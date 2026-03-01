import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const tenantUserId = searchParams.get('tenantUserId');
    const tenantSessionToken = searchParams.get('tenantSessionToken');

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const users = await prisma.tenantUser.findMany({ where: { tenantId: access.tenantId }, orderBy: { role: 'asc' } });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, tenantUserId, tenantSessionToken, name, username, password, role, phone, email } = body;

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const tenant = await prisma.tenant.findUnique({ where: { id: access.tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Negocio inválido' }, { status: 400 });

    const prefix = tenant.codePrefix || tenant.slug.substring(0, 4).toUpperCase();
    const fullUsername = `${prefix}.${username}`;

    const newUser = await prisma.tenantUser.create({
      data: {
        tenantId: access.tenantId,
        name,
        password,
        role: role || 'STAFF',
        phone: phone || '',
        email: email || '',
        username: fullUsername,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Usuario ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, tenantId, tenantUserId, tenantSessionToken } = body as { id?: string; tenantId?: string; tenantUserId?: string; tenantSessionToken?: string };

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN'] });
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const targetId = String(id || '').trim();
    if (!targetId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const target = await prisma.tenantUser.findUnique({ where: { id: targetId }, select: { tenantId: true } });
    if (!target || target.tenantId !== access.tenantId) {
      return NextResponse.json({ error: 'Usuario fuera de alcance' }, { status: 403 });
    }

    await prisma.tenantUser.delete({ where: { id: targetId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
