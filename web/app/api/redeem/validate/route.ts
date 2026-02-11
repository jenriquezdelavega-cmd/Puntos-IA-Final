import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = String(body?.tenantId || '').trim();
    const code = String(body?.code || '').trim();

    if (!tenantId || !code) {
      return NextResponse.json(
        { error: 'tenantId y code son requeridos' },
        { status: 400 }
      );
    }

    // VALIDAR premio YA GANADO (NO recalcula puntos/visitas)
    const redemption = await prisma.redemption.findFirst({
      where: { tenantId, code, isUsed: false },
      include: { user: true },
    });

    if (!redemption) {
      return NextResponse.json(
        { error: 'Código inválido o ya fue canjeado' },
        { status: 404 }
      );
    }

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { isUsed: true },
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error inesperado' },
      { status: 500 }
    );
  }
}
