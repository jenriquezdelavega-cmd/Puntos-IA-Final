import { NextResponse } from 'next/server';
import { PrismaClient, RewardPeriod } from '@prisma/client';

const prisma = new PrismaClient();
const TZ = 'America/Monterrey';

function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10); // para validación de DailyCode.day ya existente
}

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return { y: parseInt(get('year'), 10), m: parseInt(get('month'), 10), day: parseInt(get('day'), 10) };
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

    if (!userId || !code) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const dayUTC = todayKeyUTC();

    const validCode = await prisma.dailyCode.findFirst({
      where: { code, isActive: true, day: dayUTC },
      include: { tenant: true },
    });

    if (!validCode) {
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
        },
      });
    }

    // Bloqueo por día/negocio (tu regla actual)
    const dayKey = dayUTC; // mismo criterio que ya usabas para Visit.visitDay
    const alreadyToday = await prisma.visit.findFirst({
      where: { membershipId: membership.id, tenantId: validCode.tenantId, visitDay: dayKey },
    });
    if (alreadyToday) {
      return NextResponse.json({ error: '¡Ya registraste tu visita hoy!' }, { status: 400 });
    }

    // ✅ Reset por periodo (Monterrey) antes de sumar
    const now = new Date();
    const tPeriod = validCode.tenant.rewardPeriod as RewardPeriod;
    const key = periodKey(tPeriod, now);

    if ((membership.periodKey || 'OPEN') !== key) {
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: key },
      });
    }

    const [, updatedMembership] = await prisma.$transaction([
      prisma.visit.create({
        data: {
          membershipId: membership.id,
          dailyCodeId: validCode.id,
          tenantId: validCode.tenantId,
          visitDay: dayKey,
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

    const requiredVisits = validCode.tenant.requiredVisits ?? 10;

    return NextResponse.json({
      success: true,
      points: updatedMembership.currentVisits * 10,
      requiredPoints: requiredVisits * 10,
      requiredVisits,
      rewardPeriod: validCode.tenant.rewardPeriod,
      message: `¡Visita registrada en ${validCode.tenant.name}!`,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error técnico' }, { status: 500 });
  }
}
