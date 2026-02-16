import { NextResponse } from 'next/server';
import { addPrelaunchLead } from '@/app/lib/prelaunch-leads';

type LeadBody = {
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  city?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadBody;

    const businessName = String(body.businessName || '').trim();
    const contactName = String(body.contactName || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const city = String(body.city || '').trim();

    if (!businessName || !contactName || !phone || !email) {
      return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const createdAt = new Date().toISOString();

    await addPrelaunchLead({
      businessName,
      contactName,
      phone,
      email,
      city,
      createdAt,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar la solicitud.' }, { status: 500 });
  }
}
