import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

    const redemptions = await prisma.redemption.findMany({
      where: { 
        userId: userId,
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

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
