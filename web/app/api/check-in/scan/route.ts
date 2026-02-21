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
<<<<<<< HEAD
  return `${get('year')}-${get('month')}-${get('day')}`;
=======
  return `${get('year')}-${get('month')}-${get('day')}`; // para DailyCode.day
>>>>>>> origin/codex/review-my-code
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
<<<<<<< HEAD
      logApiEvent('/api/check-in/scan', 'validation_error', {
        hasUserId: Boolean(userId),
        hasCode: Boolean(code),
      });
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const day = dayKeyInBusinessTz();
=======
      logApiEvent('/api/check-in/scan', 'validation_error', { hasUserId: Boolean(userId), hasCode: Boolean(code) });
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const dayUTC = dayKeyInBusinessTz();
>>>>>>> origin/codex/review-my-code

    const validCode = await prisma.dailyCode.findFirst({
      where: { code, isActive: true, day },
      include: { tenant: true },
    });

    if (!validCode) {
<<<<<<< HEAD
      logApiEvent('/api/check-in/scan', 'invalid_code', { userId, code });
=======
      logApiEvent('/api/check-in/scan', 'invalid_code', { userId });
>>>>>>> origin/codex/review-my-code
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
<<<<<<< HEAD
      logApiEvent('/api/check-in/scan', 'duplicate_visit', {
        userId,
        tenantId: validCode.tenantId,
        visitDay,
      });
=======
      logApiEvent('/api/check-in/scan', 'duplicate_visit', { userId, tenantId: validCode.tenantId, visitDay });
>>>>>>> origin/codex/review-my-code
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

<<<<<<< HEAD
    logApiEvent('/api/check-in/scan', 'visit_registered', {
      userId,
      tenantId: validCode.tenantId,
      visitDay,
      visits: updatedMembership.currentVisits,
    });
=======
    logApiEvent('/api/check-in/scan', 'visit_registered', { userId, tenantId: validCode.tenantId, visitDay });
>>>>>>> origin/codex/review-my-code

    return NextResponse.json({
      success: true,
      visits: updatedMembership.currentVisits,
      requiredVisits: validCode.tenant.requiredVisits ?? 10,
      rewardPeriod: validCode.tenant.rewardPeriod,
      message: `¡Visita registrada en ${validCode.tenant.name}!`,
    });
<<<<<<< HEAD
  } catch (error: unknown) {
    logApiError('/api/check-in/scan', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error técnico' },
      { status: 500 }
    );
=======

  } catch (error: unknown) {
    logApiError('/api/check-in/scan', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error técnico' }, { status: 500 });
>>>>>>> origin/codex/review-my-code
  }
}
