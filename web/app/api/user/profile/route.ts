// web/app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyPassword } from '@/app/lib/password';

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
        return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    // 1. Buscar usuario con todas sus membresías y visitas recientes
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        memberships: {
          include: {
            tenant: true,
            visits: {
              take: 5, // Traer las últimas 5 visitas
              orderBy: { visitedAt: 'desc' }
            }
          }
        }
      }
    });

    // 2. Validaciones
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if (!verifyPassword(password, user.password)) return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });

    // 3. Preparar datos bonitos para la app
    const profileData = {
      name: user.name,
      phone: user.phone,
      joinedAt: user.createdAt,
      memberships: user.memberships.map(m => ({
        businessName: m.tenant.name,
        currentPoints: m.currentVisits,
        totalLifetimeVisits: m.totalVisits,
        history: m.visits
      }))
    };

    return NextResponse.json({ success: true, data: profileData });

  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
