import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { RewardPeriod } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { touchWalletPassRegistrations, walletSerialNumber } from '@/app/lib/apple-wallet-webservice';
import { listWalletPushTokens, pushWalletUpdateToDevice, deleteWalletRegistrationsByPushToken } from '@/app/lib/apple-wallet-push';
const TZ = 'America/Monterrey';

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
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

    if (!userId || !tenantId) {
      logApiEvent('/api/redeem/request', 'validation_error', { hasUserId: Boolean(userId), hasTenantId: Boolean(tenantId) });
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      logApiEvent('/api/redeem/request', 'tenant_not_found', { tenantId });
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    let membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } }
    });

    if (!membership) {
      logApiEvent('/api/redeem/request', 'membership_not_found', { userId, tenantId });
      return NextResponse.json({ error: 'No tienes membresía' }, { status: 400 });
    }

    const now = new Date();
    const tenantPeriod = (tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    // cambio de regla: adoptar sin reset
    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    // expiración natural
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
      logApiEvent('/api/redeem/request', 'insufficient_visits', { userId, tenantId, currentVisits, requiredVisits });
      return NextResponse.json({ error: `Te faltan ${requiredVisits - currentVisits} visita(s) para canjear` }, { status: 400 });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.$transaction([
      prisma.redemption.create({
        data: { code, userId, tenantId, isUsed: false }
      }),
      prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0 }
      })
    ]);

    logApiEvent('/api/redeem/request', 'redemption_requested', { userId, tenantId, code });

    try {
      const serialNumber = walletSerialNumber(userId, tenantId);
      const passTypeIdentifier = String(process.env.APPLE_PASS_TYPE_ID || '').trim() || undefined;

      await touchWalletPassRegistrations(prisma, { serialNumber, passTypeIdentifier });

      if (passTypeIdentifier) {
        const pushTokens = await listWalletPushTokens(prisma, { serialNumber, passTypeIdentifier });
        for (const pushToken of pushTokens) {
          const result = await pushWalletUpdateToDevice(pushToken, passTypeIdentifier);
          if (result.ok) {
            logApiEvent('/api/redeem/request#wallet-push', 'push_sent', { serialNumber, status: result.status });
          } else {
            if (result.status === 410 || result.status === 400) {
              await deleteWalletRegistrationsByPushToken(prisma, pushToken);
            }
            logApiEvent('/api/redeem/request#wallet-push', 'push_failed', { serialNumber, status: result.status, reason: result.reason || 'unknown' });
          }
        }
      }
    } catch (walletError) {
      logApiError('/api/redeem/request#wallet-push', walletError);
    }

    return NextResponse.json({ success: true, code });

  } catch (error: unknown) {
    logApiError('/api/redeem/request', error);
    return NextResponse.json({ error: 'Error técnico: ' + (error instanceof Error ? error.message : '') }, { status: 500 });
  }
}
