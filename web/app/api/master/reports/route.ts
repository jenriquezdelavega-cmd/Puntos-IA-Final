import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { listPrelaunchLeads } from '@/app/lib/prelaunch-leads';
import { consumeRateLimit, getClientIp } from '@/app/lib/request-rate-limit';
import { apiError, getRequestId } from '@/app/lib/api-response';
import { optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { getRedemptionChannel, getRedemptionRewardLabel } from '@/app/lib/redemption-display';

const esc = (v: unknown) => {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
};

function csv(headers: string[], rows: Array<Array<unknown>>) {
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

function parseReportType(value: unknown): 'prelaunch' | 'tenant-users' | 'redemption-logs' | 'users-without-membership' | null {
  const raw = optionalString(value);
  if (!raw || raw === 'prelaunch') return 'prelaunch';
  if (raw === 'tenant-users') return 'tenant-users';
  if (raw === 'redemption-logs') return 'redemption-logs';
  if (raw === 'users-without-membership') return 'users-without-membership';
  return null;
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const clientIp = getClientIp(req);

  try {
    const rateLimit = consumeRateLimit(`master:reports:${clientIp}`, 40, 60_000);
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'TOO_MANY_REQUESTS',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${String(rateLimit.retryAfterSeconds)}s.`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

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
      masterOtp: optionalString,
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

    const { masterUsername, masterPassword, masterOtp, report, tenantId } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
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

    if (report === 'redemption-logs') {
      const redemptions = await prisma.redemption.findMany({
        where: tenantId ? { tenantId } : undefined,
        include: {
          tenant: { select: { id: true, name: true, slug: true, prize: true } },
          user: { select: { id: true, name: true, phone: true, email: true } },
          loyaltyMilestone: { select: { reward: true, emoji: true } },
          coalitionRewardUnlock: { include: { reward: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      const content = csv(
        ['requestedAt', 'status', 'channel', 'code', 'tenantId', 'tenantName', 'tenantSlug', 'userId', 'userName', 'userPhone', 'userEmail', 'rewardLabel'],
        redemptions.map((r) => {
          const channel = getRedemptionChannel({
            loyaltyMilestoneId: r.loyaltyMilestoneId,
            coalitionRewardUnlockId: r.coalitionRewardUnlockId,
          });
          const rewardLabel = getRedemptionRewardLabel({
            tenantPrize: r.tenant.prize,
            rewardSnapshot: r.rewardSnapshot,
            code: r.code,
            loyaltyMilestone: r.loyaltyMilestone,
            coalitionRewardUnlock: r.coalitionRewardUnlock,
          });
          return [
            r.createdAt.toISOString(),
            r.isUsed ? 'VALIDATED' : 'PENDING',
            channel,
            r.code,
            r.tenant.id,
            r.tenant.name,
            r.tenant.slug,
            r.user.id,
            r.user.name || '',
            r.user.phone || '',
            r.user.email || '',
            rewardLabel,
          ];
        }),
      );

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="redemption-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
          'x-request-id': requestId,
        },
      });
    }

    if (report === 'users-without-membership') {
      const users = await prisma.user.findMany({
        where: {
          memberships: {
            none: {},
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10000,
      });

      const content = csv(
        ['userId', 'name', 'phone', 'email', 'createdAt'],
        users.map((u) => [u.id, u.name || '', u.phone || '', u.email || '', u.createdAt.toISOString()]),
      );

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="usuarios-sin-pase-activo-${new Date().toISOString().slice(0, 10)}.csv"`,
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
