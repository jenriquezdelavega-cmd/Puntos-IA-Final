import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { generateCustomerPass } from '@/app/lib/customer-pass';

type Params = {
  params: Promise<{ customer_id: string }>;
};

export async function GET(req: Request, { params }: Params) {
  try {
    const { customer_id } = await params;
    const customerId = String(customer_id || '').trim();

    if (!customerId) {
      return NextResponse.json({ error: 'customer_id requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const url = new URL(req.url);
    const businessId = String(url.searchParams.get('businessId') || url.searchParams.get('business_id') || '').trim();

    let business: {
      id: string;
      name: string;
      currentVisits: number;
      requiredVisits: number;
    } | null = null;

    if (businessId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, requiredVisits: true },
      });

      if (tenant) {
        const membership = await prisma.membership.findUnique({
          where: {
            tenantId_userId: {
              tenantId: tenant.id,
              userId: user.id,
            },
          },
          select: { currentVisits: true },
        });

        business = {
          id: tenant.id,
          name: tenant.name,
          currentVisits: membership?.currentVisits ?? 0,
          requiredVisits: tenant.requiredVisits,
        };
      }
    }

    const pass = generateCustomerPass(user.id);

    return NextResponse.json({
      customer_id: user.id,
      name: user.name || 'Cliente Punto IA',
      branding: {
        app: 'Punto IA',
        theme: 'orange-pink',
      },
      qr: {
        token: pass.token,
        value: pass.qrValue,
      },
      business,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
