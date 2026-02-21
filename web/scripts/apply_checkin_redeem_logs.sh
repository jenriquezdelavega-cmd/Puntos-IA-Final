#!/usr/bin/env bash
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p app/lib
cat > app/lib/api-log.ts <<'FILE'
export function logApiEvent(
  route: string,
  event: string,
  data: Record<string, unknown> = {}
) {
  console.info(
    JSON.stringify({
      level: 'info',
      route,
      event,
      ts: new Date().toISOString(),
      ...data,
    })
  );
}

export function logApiError(
  route: string,
  error: unknown,
  data: Record<string, unknown> = {}
) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({
      level: 'error',
      route,
      ts: new Date().toISOString(),
      message,
      ...data,
    })
  );
}
FILE

mkdir -p app/api/check-in/scan
cat > app/api/check-in/scan/route.ts <<'FILE'
import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { PrismaClient, RewardPeriod } from '@prisma/client';

const prisma = new PrismaClient();
const TZ = 'America/Monterrey';

function dayKeyInBusinessTz(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return { y: parseInt(get('year'), 10), m: parseInt(get('month'), 10) };
}

function periodKey(period: RewardPeriod, now = new Date()) {
  if (period === 'OPEN') return 'OPEN';
  const { y, m } = tzParts(now);
  if (period === 'MONTHLY') return `${y}-M${String(m).padStart(2, '0')}`;
  if (period === 'QUARTERLY') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (period === 'SEMESTER') return `${y}-S${m <= 6 ? 1 : 2}`;
  return `${y}-Y`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      logApiEvent('/api/check-in/scan', 'validation_error', {
        hasUserId: Boolean(userId),
        hasCode: Boolean(code),
      });
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const day = dayKeyInBusinessTz();

    const validCode = await prisma.dailyCode.findFirst({
      where: { code, isActive: true, day },
      include: { tenant: true },
    });

    if (!validCode) {
      logApiEvent('/api/check-in/scan', 'invalid_code', { userId, code });
      return NextResponse.json({ error: 'Código inválido o no es de hoy' }, { status: 404 });
    }

    let membership = await prisma.membership.findFirst({
      where: { userId, tenantId: validCode.tenantId },
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          userId,
          tenantId: validCode.tenantId,
          currentVisits: 0,
          totalVisits: 0,
          periodKey: 'OPEN',
          periodType: 'OPEN',
        },
      });
      logApiEvent('/api/check-in/scan', 'membership_created', {
        userId,
        tenantId: validCode.tenantId,
        membershipId: membership.id,
      });
    }

    const visitDay = day;
    const alreadyToday = await prisma.visit.findFirst({
      where: { membershipId: membership.id, tenantId: validCode.tenantId, visitDay },
    });

    if (alreadyToday) {
      logApiEvent('/api/check-in/scan', 'duplicate_visit', {
        userId,
        tenantId: validCode.tenantId,
        visitDay,
      });
      return NextResponse.json({ error: '¡Ya registraste tu visita hoy!' }, { status: 400 });
    }

    const now = new Date();
    const tenantPeriod = (validCode.tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    const curType = (membership.periodType as RewardPeriod) || 'OPEN';
    const curKey = periodKey(curType, now);

    if ((membership.periodKey || 'OPEN') !== curKey) {
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: curKey },
      });
    }

    const [, updatedMembership] = await prisma.$transaction([
      prisma.visit.create({
        data: {
          membershipId: membership.id,
          dailyCodeId: validCode.id,
          tenantId: validCode.tenantId,
          visitDay,
        },
      }),
      prisma.membership.update({
        where: { id: membership.id },
        data: {
          currentVisits: { increment: 1 },
          totalVisits: { increment: 1 },
          lastVisitAt: new Date(),
        },
      }),
    ]);

    logApiEvent('/api/check-in/scan', 'visit_registered', {
      userId,
      tenantId: validCode.tenantId,
      visitDay,
      visits: updatedMembership.currentVisits,
    });

    return NextResponse.json({
      success: true,
      visits: updatedMembership.currentVisits,
      requiredVisits: validCode.tenant.requiredVisits ?? 10,
      rewardPeriod: validCode.tenant.rewardPeriod,
      message: `¡Visita registrada en ${validCode.tenant.name}!`,
    });
  } catch (error: unknown) {
    logApiError('/api/check-in/scan', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error técnico' },
      { status: 500 }
    );
  }
}
FILE

mkdir -p app/api/redeem/request
cat > app/api/redeem/request/route.ts <<'FILE'
import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { PrismaClient, RewardPeriod } from '@prisma/client';

const prisma = new PrismaClient();
const TZ = 'America/Monterrey';

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return { y: parseInt(get('year'), 10), m: parseInt(get('month'), 10) };
}

function periodKey(period: RewardPeriod, now = new Date()) {
  if (period === 'OPEN') return 'OPEN';
  const { y, m } = tzParts(now);
  if (period === 'MONTHLY') return `${y}-M${String(m).padStart(2, '0')}`;
  if (period === 'QUARTERLY') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (period === 'SEMESTER') return `${y}-S${m <= 6 ? 1 : 2}`;
  return `${y}-Y`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, tenantId } = body;

    if (!userId || !tenantId) {
      logApiEvent('/api/redeem/request', 'validation_error', {
        hasUserId: Boolean(userId),
        hasTenantId: Boolean(tenantId),
      });
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      logApiEvent('/api/redeem/request', 'tenant_not_found', { tenantId });
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    let membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });

    if (!membership) {
      logApiEvent('/api/redeem/request', 'membership_not_found', { userId, tenantId });
      return NextResponse.json({ error: 'No tienes membresía' }, { status: 400 });
    }

    const now = new Date();
    const tenantPeriod = (tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    const curType = (membership.periodType as RewardPeriod) || 'OPEN';
    const curKey = periodKey(curType, now);

    if ((membership.periodKey || 'OPEN') !== curKey) {
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: curKey },
      });
    }

    const requiredVisits = tenant.requiredVisits ?? 10;
    const currentVisits = membership.currentVisits ?? 0;

    if (currentVisits < requiredVisits) {
      logApiEvent('/api/redeem/request', 'insufficient_visits', {
        userId,
        tenantId,
        currentVisits,
        requiredVisits,
      });
      return NextResponse.json(
        { error: `Te faltan ${requiredVisits - currentVisits} visita(s) para canjear` },
        { status: 400 }
      );
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.$transaction([
      prisma.redemption.create({
        data: { code, userId, tenantId, isUsed: false },
      }),
      prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0 },
      }),
    ]);

    logApiEvent('/api/redeem/request', 'redemption_requested', {
      userId,
      tenantId,
      code,
    });

    return NextResponse.json({ success: true, code });
  } catch (error: unknown) {
    logApiError('/api/redeem/request', error);
    return NextResponse.json(
      { error: 'Error técnico: ' + (error instanceof Error ? error.message : '') },
      { status: 500 }
    );
  }
}
FILE

mkdir -p app/api/redeem/validate
cat > app/api/redeem/validate/route.ts <<'FILE'
import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = String(body?.tenantId || '').trim();
    const code = String(body?.code || '').trim();

    if (!tenantId || !code) {
      logApiEvent('/api/redeem/validate', 'validation_error', {
        hasTenantId: Boolean(tenantId),
        hasCode: Boolean(code),
      });
      return NextResponse.json({ error: 'tenantId y code son requeridos' }, { status: 400 });
    }

    const redemption = await prisma.redemption.findFirst({
      where: { tenantId, code, isUsed: false },
      include: { user: true },
    });

    if (!redemption) {
      logApiEvent('/api/redeem/validate', 'invalid_or_used_code', { tenantId, code });
      return NextResponse.json({ error: 'Código inválido o ya fue canjeado' }, { status: 404 });
    }

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { isUsed: true },
    });

    logApiEvent('/api/redeem/validate', 'redemption_validated', {
      tenantId,
      code,
      redemptionId: redemption.id,
    });

    return NextResponse.json({
      ok: true,
      user: redemption.user?.name || redemption.user?.phone || 'Usuario',
      redemption: {
        id: redemption.id,
        code: redemption.code,
        tenantId: redemption.tenantId,
        isUsed: true,
        usedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logApiError('/api/redeem/validate', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado' },
      { status: 500 }
    );
  }
}
FILE

echo "✅ check-in/scan + redeem logs aplicados" 
