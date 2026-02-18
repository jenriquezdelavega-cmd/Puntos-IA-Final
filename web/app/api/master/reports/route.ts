import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { listPrelaunchLeads } from '@/app/lib/prelaunch-leads';

const prisma = new PrismaClient();

type Body = {
  masterPassword?: string;
  report?: 'prelaunch' | 'tenant-users';
  tenantId?: string;
};

const esc = (v: unknown) => {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
};

function csv(headers: string[], rows: Array<Array<unknown>>) {
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!isValidMasterPassword(body.masterPassword)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const report = body.report || 'prelaunch';

    if (report === 'prelaunch') {
      const leads = await listPrelaunchLeads();
      const content = csv(
        ['createdAt', 'businessName', 'contactName', 'phone', 'email', 'city'],
        leads.map((l) => [l.createdAt, l.businessName, l.contactName, l.phone, l.email, l.city])
      );

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="preinscritos-negocios-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const where = body.tenantId ? { id: body.tenantId } : undefined;
    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        memberships: {
          include: { user: true },
          orderBy: { totalVisits: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const rows: Array<Array<unknown>> = [];
    for (const t of tenants) {
      if (t.memberships.length === 0) {
        rows.push([t.id, t.name, t.slug, '', '', '', '', '', '']);
        continue;
      }

      for (const m of t.memberships) {
        rows.push([
          t.id,
          t.name,
          t.slug,
          m.userId,
          m.user?.name || '',
          m.user?.phone || '',
          m.user?.email || '',
          m.totalVisits,
          m.currentVisits,
        ]);
      }
    }

    const content = csv(
      ['tenantId', 'tenantName', 'tenantSlug', 'userId', 'userName', 'userPhone', 'userEmail', 'totalVisits', 'currentVisits'],
      rows
    );

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes-por-negocio-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 });
  }
}
