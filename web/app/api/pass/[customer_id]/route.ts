import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCustomerPass } from '@/app/lib/customer-pass';

const prisma = new PrismaClient();

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

    const { searchParams } = new URL(req.url);
    const businessId = String(searchParams.get('businessId') || searchParams.get('business_id') || '').trim();

    const pass = generateCustomerPass(user.id);

    let business: { id: string; name: string; currentVisits: number; requiredVisits: number } | null = null;
    if (businessId) {
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, tenantId: businessId },
        include: { tenant: { select: { id: true, name: true, requiredVisits: true } } },
      });

      if (membership?.tenant) {
        business = {
          id: membership.tenant.id,
          name: membership.tenant.name,
          currentVisits: membership.currentVisits,
          requiredVisits: membership.tenant.requiredVisits ?? 10,
        };
      } else {
        const tenant = await prisma.tenant.findUnique({
          where: { id: businessId },
          select: { id: true, name: true, requiredVisits: true },
        });
        if (tenant) {
          business = {
            id: tenant.id,
            name: tenant.name,
            currentVisits: 0,
            requiredVisits: tenant.requiredVisits ?? 10,
          };
        }
      }
    }

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
