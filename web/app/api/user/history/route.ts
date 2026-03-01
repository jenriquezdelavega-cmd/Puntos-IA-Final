import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sessionToken } = body as { userId?: string; sessionToken?: string };

    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const session = verifyUserSessionToken(String(sessionToken || ''));
    if (session.uid !== normalizedUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const redemptions = await prisma.redemption.findMany({
      where: { 
        userId: normalizedUserId,
        isUsed: true // Solo premios ya cobrados
      },
      include: {
        tenant: {
          select: { name: true, prize: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatear fecha bonita
    const history = redemptions.map(r => ({
      id: r.id,
      tenant: r.tenant.name,
      prize: r.tenant.prize,
      date: new Date(r.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date(r.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    }));

    return NextResponse.json({ history });

  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message?: string }).message || '');
      if (message.startsWith('sessionToken')) {
        return NextResponse.json({ error: 'Sesión inválida, vuelve a iniciar sesión' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
