import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = String(body?.tenantId || '').trim();
    const tenantUserId = String(body?.tenantUserId || '').trim();
    const tenantSessionToken = String(body?.tenantSessionToken || '').trim();
    const code = String(body?.code || '').trim();

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('redeem-validate', request, `${tenantId}:${tenantUserId}`),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: `Demasiadas validaciones. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s` }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
    }

    const access = await requireTenantRoleAccess({ tenantId, tenantUserId, tenantSessionToken, allowedRoles: ['ADMIN', 'STAFF'] });
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (!code) {
      logApiEvent('/api/redeem/validate', 'validation_error', { tenantId: access.tenantId, hasCode: false });
      return NextResponse.json(
        { error: 'code es requerido' },
        { status: 400 }
      );
    }

    const redemption = await prisma.redemption.findFirst({
      where: { tenantId: access.tenantId, code, isUsed: false },
      include: { user: true },
    });

    if (!redemption) {
      logApiEvent('/api/redeem/validate', 'invalid_or_used_code', { tenantId: access.tenantId, code });
      return NextResponse.json(
        { error: 'Código inválido o ya fue canjeado' },
        { status: 404 }
      );
    }

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { isUsed: true },
    });

    logApiEvent('/api/redeem/validate', 'redemption_validated', { tenantId: access.tenantId, code, redemptionId: redemption.id });

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
