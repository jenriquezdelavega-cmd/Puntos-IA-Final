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
<<<<<<< HEAD
      logApiEvent('/api/redeem/validate', 'validation_error', {
        hasTenantId: Boolean(tenantId),
        hasCode: Boolean(code),
      });
      return NextResponse.json({ error: 'tenantId y code son requeridos' }, { status: 400 });
=======
      logApiEvent('/api/redeem/validate', 'validation_error', { hasTenantId: Boolean(tenantId), hasCode: Boolean(code) });
      return NextResponse.json(
        { error: 'tenantId y code son requeridos' },
        { status: 400 }
      );
>>>>>>> origin/codex/review-my-code
    }

    const redemption = await prisma.redemption.findFirst({
      where: { tenantId, code, isUsed: false },
      include: { user: true },
    });

    if (!redemption) {
      logApiEvent('/api/redeem/validate', 'invalid_or_used_code', { tenantId, code });
<<<<<<< HEAD
      return NextResponse.json({ error: 'Código inválido o ya fue canjeado' }, { status: 404 });
=======
      return NextResponse.json(
        { error: 'Código inválido o ya fue canjeado' },
        { status: 404 }
      );
>>>>>>> origin/codex/review-my-code
    }

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { isUsed: true },
    });

<<<<<<< HEAD
    logApiEvent('/api/redeem/validate', 'redemption_validated', {
      tenantId,
      code,
      redemptionId: redemption.id,
    });
=======
    logApiEvent('/api/redeem/validate', 'redemption_validated', { tenantId, code, redemptionId: redemption.id });
>>>>>>> origin/codex/review-my-code

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
