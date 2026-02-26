import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { ensureWalletRegistrationsTable } from '@/app/lib/apple-wallet-webservice';
import { pushWalletUpdateToDevice, deleteWalletRegistrationsByPushToken } from '@/app/lib/apple-wallet-push';

const MAX_PUSHES_PER_WEEK = 2;

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, message } = body;

    if (!tenantId) return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });
    if (!message || !String(message).trim()) return NextResponse.json({ error: 'Escribe un mensaje para la notificación' }, { status: 400 });
    if (String(message).length > 200) return NextResponse.json({ error: 'El mensaje no puede tener más de 200 caracteres' }, { status: 400 });

    const passTypeIdentifier = String(process.env.APPLE_PASS_TYPE_ID || '').trim();
    if (!passTypeIdentifier) return NextResponse.json({ error: 'APPLE_PASS_TYPE_ID no configurado' }, { status: 500 });

    const weekStart = startOfWeek();
    const pushesThisWeek = await prisma.tenantPushLog.count({
      where: { tenantId, sentAt: { gte: weekStart } },
    });

    if (pushesThisWeek >= MAX_PUSHES_PER_WEEK) {
      return NextResponse.json({
        error: `Ya enviaste ${MAX_PUSHES_PER_WEEK} notificaciones esta semana. Podrás enviar más el próximo lunes.`,
        remaining: 0,
      }, { status: 429 });
    }

    const trimmedMessage = String(message).trim();

    await prisma.tenantWalletStyle.upsert({
      where: { tenantId },
      update: { lastPushMessage: trimmedMessage },
      create: { tenantId, lastPushMessage: trimmedMessage },
    });

    await ensureWalletRegistrationsTable(prisma);

    const registrations = await prisma.$queryRawUnsafe<Array<{ push_token: string; serial_number: string }>>(
      `SELECT DISTINCT push_token, serial_number
       FROM apple_wallet_registrations
       WHERE serial_number LIKE $1
         AND pass_type_identifier = $2`,
      `%-${tenantId}`,
      passTypeIdentifier
    );

    await prisma.$executeRawUnsafe(
      `UPDATE apple_wallet_registrations SET updated_at = NOW()
       WHERE serial_number LIKE $1 AND pass_type_identifier = $2`,
      `%-${tenantId}`,
      passTypeIdentifier
    );

    let sent = 0;
    let failed = 0;

    const seenTokens = new Set<string>();
    for (const reg of registrations) {
      const token = String(reg.push_token || '').trim();
      if (!token || seenTokens.has(token)) continue;
      seenTokens.add(token);

      try {
        const result = await pushWalletUpdateToDevice(token, passTypeIdentifier);
        if (result.ok) {
          sent++;
        } else {
          failed++;
          if (result.status === 410 || result.status === 400) {
            await deleteWalletRegistrationsByPushToken(prisma, token);
          }
        }
      } catch {
        failed++;
      }
    }

    await prisma.tenantPushLog.create({
      data: { tenantId, message: trimmedMessage, devices: sent },
    });

    logApiEvent('/api/admin/push', 'push_broadcast', {
      tenantId,
      message: trimmedMessage,
      totalRegistrations: registrations.length,
      sent,
      failed,
      remaining: MAX_PUSHES_PER_WEEK - pushesThisWeek - 1,
    });

    return NextResponse.json({
      success: true,
      sent,
      failed,
      remaining: MAX_PUSHES_PER_WEEK - pushesThisWeek - 1,
      message: `Notificación enviada a ${sent} dispositivo${sent === 1 ? '' : 's'}`,
    });
  } catch (error: unknown) {
    logApiError('/api/admin/push', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error enviando notificación' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'tenantId requerido' }, { status: 400 });

    const weekStart = startOfWeek();
    const pushesThisWeek = await prisma.tenantPushLog.count({
      where: { tenantId, sentAt: { gte: weekStart } },
    });

    const recentPushes = await prisma.tenantPushLog.findMany({
      where: { tenantId },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      remaining: MAX_PUSHES_PER_WEEK - pushesThisWeek,
      maxPerWeek: MAX_PUSHES_PER_WEEK,
      recent: recentPushes,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
