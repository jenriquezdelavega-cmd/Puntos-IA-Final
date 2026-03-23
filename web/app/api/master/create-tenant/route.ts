import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { consumeRateLimit, getClientIp } from '@/app/lib/request-rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { getGoogleWalletClassIdForTenant, GOOGLE_WALLET_PROGRAM_NAME_HIDDEN, upsertGoogleLoyaltyClass } from '@/app/lib/google-wallet';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const clientIp = getClientIp(request);

  try {
    const rateLimit = consumeRateLimit(`master:create-tenant:${clientIp}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'TOO_MANY_REQUESTS',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${String(rateLimit.retryAfterSeconds)}s.`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'JSON inválido',
      });
    }
    const parsedBody = parseWithSchema(body, {
      masterUsername: requiredString,
      masterPassword: requiredString,
      masterOtp: optionalString,
      name: requiredString,
      slug: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, masterOtp, name, slug } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const prefix = name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 99).toString();

    const newTenant = await prisma.tenant.create({
      data: { name, slug, codePrefix: prefix },
    });

    const googleClassId = getGoogleWalletClassIdForTenant(newTenant.id);
    let googleWalletClass: { operation: string; status: number; classId: string } | null = null;

    if (googleClassId) {
      try {
        const result = await upsertGoogleLoyaltyClass({
          classId: googleClassId,
          issuerName: newTenant.name,
          programName: GOOGLE_WALLET_PROGRAM_NAME_HIDDEN,
        });

        googleWalletClass = {
          operation: result.operation,
          status: result.status,
          classId: result.classId,
        };
      } catch (classError) {
        console.warn('[master/create-tenant] No se pudo sincronizar clase de Google Wallet:', classError instanceof Error ? classError.message : classError);
      }
    }

    return apiSuccess({ requestId, data: { success: true, tenant: newTenant, googleWalletClass } });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return apiError({
        requestId,
        status: 400,
        code: 'CONFLICT',
        message: 'Slug o Prefijo duplicado',
      });
    }

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
