import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateCustomerPass } from '@/app/lib/customer-pass';

const prisma = new PrismaClient();

type Params = {
  params: Promise<{ customer_id: string }>;
};

export async function GET(_req: Request, { params }: Params) {
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
