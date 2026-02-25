import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { generateCustomerPass } from '@/app/lib/customer-pass';

type Body = {
  customerId?: string;
  phone?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const customerId = String(body.customerId || '').trim();
    const phone = String(body.phone || '').trim();

    if (!customerId && !phone) {
      return NextResponse.json({ error: 'customerId o phone requerido' }, { status: 400 });
    }

    const user = customerId
      ? await prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true, phone: true } })
      : await prisma.user.findUnique({ where: { phone }, select: { id: true, name: true, phone: true } });

    if (!user) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const pass = generateCustomerPass(user.id);
    const passPath = `/pass?customer_id=${encodeURIComponent(user.id)}`;

    return NextResponse.json({
      customer: { id: user.id, name: user.name || 'Cliente Punto IA', phone: user.phone },
      pass: { token: pass.token, qrValue: pass.qrValue, path: passPath },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
