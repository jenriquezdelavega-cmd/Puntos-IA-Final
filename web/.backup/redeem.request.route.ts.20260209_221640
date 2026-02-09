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

    if (!userId || !tenantId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });

    const membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } }
    });

    if (!membership) return NextResponse.json({ error: 'No tienes membresía' }, { status: 400 });

    // Reset “lazy” también aquí
    const key = periodKey(tenant.rewardPeriod as RewardPeriod, new Date());
    let currentVisits = membership.currentVisits ?? 0;

    if ((membership.periodKey || 'OPEN') !== key) {
      const up = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: key }
      });
      currentVisits = up.currentVisits;
    }

    const requiredVisits = tenant.requiredVisits ?? 10;
    if (currentVisits < requiredVisits) {
      return NextResponse.json({ error: `Te faltan ${requiredVisits - currentVisits} visita(s) para canjear` }, { status: 400 });
    }

    // Código de canje (puede seguir siendo corto porque se valida en backend)
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.$transaction([
      prisma.redemption.create({
        data: { code, userId, tenantId, isUsed: false }
      }),
      // ✅ Reset de visitas del periodo tras canje (para que “vuelva a juntar”)
      prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0 }
      })
    ]);

    return NextResponse.json({ success: true, code });

  } catch (error: any) {
    return NextResponse.json({ error: 'Error técnico: ' + (error.message || '') }, { status: 500 });
  }
}
