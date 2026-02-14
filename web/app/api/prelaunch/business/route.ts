import { NextResponse } from 'next/server';

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

    console.info(
      JSON.stringify({
        level: 'info',
        route: '/api/prelaunch/business',
        event: 'lead_submitted',
        ts: new Date().toISOString(),
        businessName,
        contactName,
        phone,
        email,
        city,
      })
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo procesar la solicitud.' }, { status: 500 });
  }
}
