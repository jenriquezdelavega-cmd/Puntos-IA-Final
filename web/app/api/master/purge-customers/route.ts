import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { consumeRateLimit, getClientIp } from '@/app/lib/request-rate-limit';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  asTrimmedString,
  optionalString,
  parseJsonObject,
  parseWithSchema,
  requiredString,
} from '@/app/lib/request-validation';

const PURGE_CONFIRMATION_KEY = 'BORRAR_CLIENTES_GLOBAL';

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const raw = asTrimmedString(value).toLowerCase();
  if (!raw) return undefined;
  if (['1', 'true', 'yes', 'si', 'sí'].includes(raw)) return true;
  if (['0', 'false', 'no'].includes(raw)) return false;
  return undefined;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const clientIp = getClientIp(request);

  try {
    const rateLimit = consumeRateLimit(`master:purge-customers:${clientIp}`, 3, 5 * 60_000);
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'TOO_MANY_REQUESTS',
        message: `Límite temporal alcanzado. Intenta de nuevo en ${String(rateLimit.retryAfterSeconds)}s.`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      masterUsername: requiredString,
      masterPassword: requiredString,
      masterOtp: optionalString,
      confirmationKey: requiredString,
      dryRun: parseOptionalBoolean,
    });

    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, masterOtp, confirmationKey, dryRun } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    if (confirmationKey !== PURGE_CONFIRMATION_KEY) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Confirmación inválida. Usa exactamente: ${PURGE_CONFIRMATION_KEY}`,
      });
    }

    const counts = {
      users: await prisma.user.count(),
      memberships: await prisma.membership.count(),
      visits: await prisma.visit.count(),
      redemptions: await prisma.redemption.count(),
      passwordResetTokens: await prisma.passwordResetToken.count(),
      emailVerificationTokens: await prisma.emailVerificationToken.count(),
      phoneVerificationCodes: await prisma.phoneVerificationCode.count(),
      challengeProgress: await prisma.customerChallengeProgress.count(),
      coalitionRewardUnlocks: await prisma.customerCoalitionReward.count(),
    };

    if (dryRun !== false) {
      return apiSuccess({
        requestId,
        data: {
          dryRun: true,
          confirmationKey: PURGE_CONFIRMATION_KEY,
          counts,
          message: 'Simulación completada. Envía dryRun=false para ejecutar el borrado global.',
        },
      });
    }

    await prisma.$transaction([
      prisma.visit.deleteMany({}),
      prisma.redemption.deleteMany({}),
      prisma.membership.deleteMany({}),
      prisma.passwordResetToken.deleteMany({}),
      prisma.emailVerificationToken.deleteMany({}),
      prisma.phoneVerificationCode.deleteMany({}),
      prisma.customerChallengeProgress.deleteMany({}),
      prisma.customerCoalitionReward.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);

    return apiSuccess({
      requestId,
      data: {
        dryRun: false,
        deleted: counts,
        message: 'Base global de clientes eliminada correctamente.',
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno al borrar base global de clientes',
    });
  }
}
