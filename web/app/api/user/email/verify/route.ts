import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { hashPasswordResetToken } from '@/app/lib/password-reset';

function buildRedirectUrl(request: Request, status: 'ok' | 'invalid' | 'expired' | 'already') {
  const configuredBaseUrl = String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim();
  const fallbackBaseUrl = new URL(request.url).origin;
  const baseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/$/, '');
  return `${baseUrl}/ingresar?tipo=cliente&modo=login&emailVerification=${status}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawToken = String(url.searchParams.get('token') || '').trim();
  if (!rawToken) {
    return NextResponse.redirect(buildRedirectUrl(request, 'invalid'));
  }

  const tokenHash = hashPasswordResetToken(rawToken);
  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, emailVerifiedAt: true },
      },
    },
  });

  if (!tokenRecord) {
    return NextResponse.redirect(buildRedirectUrl(request, 'invalid'));
  }

  if (tokenRecord.usedAt || tokenRecord.user.emailVerifiedAt) {
    return NextResponse.redirect(buildRedirectUrl(request, 'already'));
  }

  if (tokenRecord.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(buildRedirectUrl(request, 'expired'));
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(buildRedirectUrl(request, 'ok'));
}
