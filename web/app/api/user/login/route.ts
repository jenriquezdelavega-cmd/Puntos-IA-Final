import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();
    if (!phone) return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        memberships: {
          include: {
            tenant: true, // ✅ incluye logoData, prize, requiredVisits, rewardPeriod, instagram, etc.
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'Usuario no existe' }, { status: 401 });

    // Auth MVP (si tienes password simple)
    if (user.password && password !== undefined && user.password !== password) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const memberships = (user.memberships || [])
      .filter((m: any) => m?.tenant?.isActive !== false)
      .map((m: any) => {
        // compatibilidad: algunos builds usan currentVisits/points/visits
        const visits = Number(m.visits ?? m.currentVisits ?? 0);
        const points = Number(m.points ?? visits * 10);

        return {
          tenantId: m.tenantId,
          name: m.tenant?.name,
          prize: m.tenant?.prize ?? 'Premio Sorpresa',
          instagram: m.tenant?.instagram ?? '',
          requiredVisits: m.tenant?.requiredVisits ?? 10,
          rewardPeriod: m.tenant?.rewardPeriod ?? 'OPEN',
          logoData: m.tenant?.logoData ?? '', // ✅ aquí va el logo para el cliente
          visits,
          points,
        };
      });

    return NextResponse.json({
      id: user.id,
      phone: user.phone,
      name: (user as any).name ?? '',
      email: (user as any).email ?? '',
      gender: (user as any).gender ?? '',
      birthDate: (user as any).birthDate ?? null,
      memberships,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
