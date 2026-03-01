import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';
import { generateUserSessionToken } from '@/app/lib/user-session-token';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';

type LoginBody = {
  phone?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const { phone, password } = (await req.json()) as LoginBody;
    const normalizedPhone = String(phone || '').trim();

    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });
    }

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('user-login', req, normalizedPhone),
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: `Demasiados intentos. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s` }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
    }

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'Usuario no existe' }, { status: 401 });

    if (typeof user.password === 'string' && user.password.length > 0) {
      const inputPassword = String(password || '');
      const validPassword = verifyPassword(inputPassword, user.password);

      if (!validPassword) {
        return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
      }

      if (!isHashedPassword(user.password)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashPassword(inputPassword) },
        });
      }
    }

    const memberships = user.memberships
      .filter((membership) => membership?.tenant?.isActive !== false)
      .map((membership) => {
        const visits = Number(membership.currentVisits ?? 0);
        const points = visits * 10;

        return {
          tenantId: membership.tenantId,
          name: membership.tenant?.name,
          prize: membership.tenant?.prize ?? 'Premio Sorpresa',
          instagram: membership.tenant?.instagram ?? '',
          requiredVisits: membership.tenant?.requiredVisits ?? 10,
          rewardPeriod: membership.tenant?.rewardPeriod ?? 'OPEN',
          logoData: membership.tenant?.logoData ?? '',
          visits,
          points,
        };
      });

    const sessionToken = generateUserSessionToken({ uid: user.id, phone: user.phone });

    return NextResponse.json({
      id: user.id,
      phone: user.phone,
      name: user.name ?? '',
      email: user.email ?? '',
      gender: user.gender ?? '',
      birthDate: user.birthDate ?? null,
      memberships,
      sessionToken,
    });
  } catch (error: unknown) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Error')
        : 'Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
