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

    const saved = await addPrelaunchLead({
      businessName,
      contactName,
      phone,
      email,
      city,
      createdAt,
    });

    console.info(
      JSON.stringify({
        level: 'info',
        route: '/api/prelaunch/business',
        event: 'lead_submitted',
        ts: createdAt,
        saved: saved.ok,
        file: saved.file,
        businessName,
        contactName,
        phone,
        email,
        city,
      })
    );

    if (!saved.ok) {
      return NextResponse.json({ error: 'No se pudo guardar en almacenamiento. Revisa permisos del servidor.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('prelaunch_business_error', error);
    return NextResponse.json({ error: 'No se pudo procesar la solicitud.' }, { status: 500 });
  }
}
