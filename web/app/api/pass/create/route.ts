import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString, parseJsonObject } from '@/app/lib/request-validation';
import { generateCustomerPass } from '@/app/lib/customer-pass';
import { appendFileSync } from 'node:fs';


export async function POST(req: Request) {
  const requestId = getRequestId(req);

  try {
    const body = await parseJsonObject(req);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const customerId = asTrimmedString(body.customerId);
    const phone = asTrimmedString(body.phone);

    if (!customerId && !phone) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'customerId o phone requerido',
      });
    }

    const user = customerId
      ? await prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true, phone: true } })
      : await prisma.user.findUnique({ where: { phone }, select: { id: true, name: true, phone: true } });

    if (!user) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Cliente no encontrado',
      });
    }

    const pass = generateCustomerPass(user.id);
    // #region agent log
    appendFileSync('/opt/cursor/logs/debug.log', JSON.stringify({
      hypothesisId: 'H1',
      location: 'web/app/api/pass/create/route.ts:50',
      message: 'pass/create generated pass payload',
      data: { customerId: user.id, tokenLength: pass.token.length, qrPrefix: pass.qrValue.slice(0, 12) },
      timestamp: Date.now(),
    }) + '\n');
    // #endregion
    const passPath = `/pass?customer_id=${encodeURIComponent(user.id)}`;

    return apiSuccess({
      requestId,
      data: {
        customer: { id: user.id, name: user.name || 'Cliente Punto IA', phone: user.phone },
        pass: { token: pass.token, qrValue: pass.qrValue, path: passPath },
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
