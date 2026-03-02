import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { listPrelaunchLeads } from '@/app/lib/prelaunch-leads';
import { apiError, getRequestId } from '@/app/lib/api-response';
import { optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

const esc = (v: unknown) => {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
};

function csv(headers: string[], rows: Array<Array<unknown>>) {
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

function parseReportType(value: unknown): 'prelaunch' | 'tenant-users' | null {
  const raw = optionalString(value);
  if (!raw || raw === 'prelaunch') return 'prelaunch';
  if (raw === 'tenant-users') return 'tenant-users';
  return null;
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);

  try {
    const body = await parseJsonObject(req);
    if (!body) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'JSON inválido',
      });
    }
    const parsedBody = parseWithSchema(body, {
      masterUsername: requiredString,
      masterPassword: requiredString,
      report: parseReportType,
      tenantId: optionalString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, report, tenantId } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    if (report === 'prelaunch') {
      const leads = await listPrelaunchLeads();
      const content = csv(
        ['createdAt', 'businessName', 'contactName', 'phone', 'email', 'city'],
        leads.map((l) => [l.createdAt, l.businessName, l.contactName, l.phone, l.email, l.city]),
      );

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="preinscritos-negocios-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
          'x-request-id': requestId,
        },
      });
    }

    const where = tenantId ? { id: tenantId } : undefined;
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
        rows.push([t.id, t.name, t.slug, m.userId, m.user?.name || '', m.user?.phone || '', m.user?.email || '', m.totalVisits, m.currentVisits]);
      }
    }

    const content = csv(
      ['tenantId', 'tenantName', 'tenantSlug', 'userId', 'userName', 'userPhone', 'userEmail', 'totalVisits', 'currentVisits'],
      rows,
    );

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes-por-negocio-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
        'x-request-id': requestId,
      },
    });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error generando reporte',
    });
  }
}
