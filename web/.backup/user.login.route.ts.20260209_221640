import { NextResponse } from 'next/server';
import { PrismaClient, RewardPeriod } from '@prisma/client';

const prisma = new PrismaClient();
const TZ = 'America/Monterrey';

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
  if (period === 'QUARTERLY') {
    const q = Math.floor((m - 1) / 3) + 1; // Q1=Jan-Mar
    return `${y}-Q${q}`;
  }
  if (period === 'SEMESTER') {
    const s = m <= 6 ? 1 : 2; // S1=Jan-Jun
    return `${y}-S${s}`;
  }
  // ANNUAL: calendario inicia en enero
  return `${y}-Y`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        memberships: {
          where: { tenant: { isActive: true } },
          include: { tenant: true }
        }
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // ✅ Reset “lazy” al iniciar sesión si el periodo ya cambió
    const now = new Date();
    for (const m of user.memberships) {
      const key = periodKey(m.tenant.rewardPeriod as RewardPeriod, now);
      if ((m.periodKey || 'OPEN') !== key) {
        await prisma.membership.update({
          where: { id: m.id },
          data: { currentVisits: 0, periodKey: key }
        });
        m.currentVisits = 0;
        m.periodKey = key;
      }
    }

    const memberships = user.memberships.map(m => {
      const requiredVisits = m.tenant.requiredVisits ?? 10;
      return {
        tenantId: m.tenantId,
        name: m.tenant.name,
        prize: m.tenant.prize,
        instagram: m.tenant.instagram,
        rewardPeriod: m.tenant.rewardPeriod,
        requiredVisits,
        requiredPoints: requiredVisits * 10,
        points: (m.currentVisits ?? 0) * 10,
      };
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      gender: user.gender,
      birthDate: user.birthDate,
      memberships
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error interno: ' + (error.message || '') }, { status: 500 });
  }
}
