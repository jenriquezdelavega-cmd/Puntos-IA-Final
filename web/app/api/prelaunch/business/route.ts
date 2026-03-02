import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { addPrelaunchLead } from '@/app/lib/prelaunch-leads';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';


export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const businessName = asTrimmedString(body.businessName);
    const contactName = asTrimmedString(body.contactName);
    const phone = asTrimmedString(body.phone);
    const email = asTrimmedString(body.email);
    const city = asTrimmedString(body.city);

    if (!businessName || !contactName || !phone || !email) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Faltan datos obligatorios.',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Email inválido.',
      });
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
      return apiError({
        requestId,
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'No se pudo guardar en almacenamiento. Revisa permisos del servidor.',
      });
    }

    return apiSuccess({
      requestId,
      data: { ok: true },
    });
  } catch (error) {
    console.error('prelaunch_business_error', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'No se pudo procesar la solicitud.',
    });
  }
}
