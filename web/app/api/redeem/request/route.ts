import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { RewardPeriod } from '@prisma/client';
import { prisma } from '@/app/lib/prisma';
import { touchWalletPassRegistrations, walletSerialNumber } from '@/app/lib/apple-wallet-webservice';
import { listWalletPushTokens, pushWalletUpdateToDevice, deleteWalletRegistrationsByPushToken } from '@/app/lib/apple-wallet-push';
import { verifyUserSessionToken } from '@/app/lib/user-session-token';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { syncGoogleLoyaltyObjectForCustomer } from '@/app/lib/google-wallet-object-sync';
import { addGoogleLoyaltyObjectMessage } from '@/app/lib/google-wallet';
import { sendRedemptionRequestedEmail } from '@/app/lib/email';
const TZ = 'America/Monterrey';

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return { y: parseInt(get('year'), 10), m: parseInt(get('month'), 10) };
}

function periodKey(period: RewardPeriod, now = new Date()) {
  if (period === 'OPEN') return 'OPEN';
  const { y, m } = tzParts(now);
  if (period === 'MONTHLY') return `${y}-M${String(m).padStart(2, '0')}`;
  if (period === 'QUARTERLY') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (period === 'SEMESTER') return `${y}-S${m <= 6 ? 1 : 2}`;
  return `${y}-Y`;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const parsedBody = parseWithSchema(body, {
      userId: requiredString,
      tenantId: requiredString,
      sessionToken: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { userId, tenantId, sessionToken } = parsedBody.data;
    const normalizedUserId = asTrimmedString(userId);
    const normalizedTenantId = asTrimmedString(tenantId);

    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('redeem-request', request, normalizedUserId),
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return apiError({
        requestId,
        status: 429,
        code: 'BAD_REQUEST',
        message: `Demasiadas solicitudes. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    if (!normalizedUserId || !normalizedTenantId) {
      logApiEvent('/api/redeem/request', 'validation_error', {
        hasUserId: Boolean(normalizedUserId),
        hasTenantId: Boolean(normalizedTenantId),
      });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Faltan datos',
      });
    }

    const session = verifyUserSessionToken(asTrimmedString(sessionToken));
    if (session.uid !== normalizedUserId) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: normalizedTenantId },
      select: {
        id: true,
        name: true,
        prize: true,
        requiredVisits: true,
        rewardPeriod: true,
      },
    });
    if (!tenant) {
      logApiEvent('/api/redeem/request', 'tenant_not_found', { tenantId: normalizedTenantId });
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Negocio no encontrado',
      });
    }

    let membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId: normalizedTenantId, userId: normalizedUserId } },
    });

    if (!membership) {
      logApiEvent('/api/redeem/request', 'membership_not_found', {
        userId: normalizedUserId,
        tenantId: normalizedTenantId,
      });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'No tienes membresía',
      });
    }

    const now = new Date();
    const tenantPeriod = (tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    const curType = (membership.periodType as RewardPeriod) || 'OPEN';
    const curKey = periodKey(curType, now);

    if ((membership.periodKey || 'OPEN') !== curKey) {
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: curKey },
      });
    }

    const requiredVisits = tenant.requiredVisits ?? 10;
    const currentVisits = membership.currentVisits ?? 0;

    if (currentVisits < requiredVisits) {
      logApiEvent('/api/redeem/request', 'insufficient_visits', {
        userId: normalizedUserId,
        tenantId: normalizedTenantId,
        currentVisits,
        requiredVisits,
      });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Te faltan ${requiredVisits - currentVisits} visita(s) para canjear`,
      });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.$transaction([
      prisma.redemption.create({
        data: { code, userId: normalizedUserId, tenantId: normalizedTenantId, isUsed: false },
      }),
      prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0 },
      }),
    ]);

    logApiEvent('/api/redeem/request', 'redemption_requested', {
      userId: normalizedUserId,
      tenantId: normalizedTenantId,
      code,
    });

    try {
      const customer = await prisma.user.findUnique({
        where: { id: normalizedUserId },
        select: { email: true, name: true },
      });
      if (customer?.email) {
        const emailResult = await sendRedemptionRequestedEmail({
          to: customer.email,
          name: customer.name,
          businessName: tenant.name,
          code,
        });
        if (!emailResult.ok) {
          logApiEvent('/api/redeem/request', 'redeem_request_email_failed', {
            userId: normalizedUserId,
            reason: emailResult.error || 'unknown',
          });
        }
      }
    } catch (emailError: unknown) {
      logApiError('/api/redeem/request#email', emailError);
    }

    try {
      const serialNumber = walletSerialNumber(normalizedUserId, normalizedTenantId);
      const passTypeIdentifier = asTrimmedString(process.env.APPLE_PASS_TYPE_ID) || undefined;

      await touchWalletPassRegistrations(prisma, { serialNumber, passTypeIdentifier });

      if (passTypeIdentifier) {
        const pushTokens = await listWalletPushTokens(prisma, { serialNumber, passTypeIdentifier });
        for (const pushToken of pushTokens) {
          const result = await pushWalletUpdateToDevice(pushToken, passTypeIdentifier);
          if (result.ok) {
            logApiEvent('/api/redeem/request#wallet-push', 'push_sent', {
              serialNumber,
              status: result.status,
            });
          } else {
            if (result.status === 410 || result.status === 400) {
              await deleteWalletRegistrationsByPushToken(prisma, pushToken);
            }
            logApiEvent('/api/redeem/request#wallet-push', 'push_failed', {
              serialNumber,
              status: result.status,
              reason: result.reason || 'unknown',
            });
          }
        }
      }
    } catch (walletError) {
      logApiError('/api/redeem/request#wallet-push', walletError);
    }

    try {
      const googleSync = await syncGoogleLoyaltyObjectForCustomer({
        tenantId: normalizedTenantId,
        userId: normalizedUserId,
        origin: new URL(request.url).origin,
      });
      if (!googleSync.ok) {
        logApiEvent('/api/redeem/request#google-sync', 'sync_skipped', {
          tenantId: normalizedTenantId,
          userId: normalizedUserId,
          reason: googleSync.reason,
          operation: googleSync.operation,
          status: googleSync.status,
        });
      } else if (googleSync.objectId) {
        const messageResult = await addGoogleLoyaltyObjectMessage({
          objectId: googleSync.objectId,
          header: '🎁 Canje solicitado',
          body: 'Tus sellos se reiniciaron. ¡Empieza tu siguiente recompensa!',
          messageId: `redeem_${Date.now()}`,
        });
        logApiEvent('/api/redeem/request#google-sync', messageResult.ok ? 'message_sent' : 'message_failed', {
          tenantId: normalizedTenantId,
          userId: normalizedUserId,
          objectId: googleSync.objectId,
          status: messageResult.status,
        });
      } else if (googleSync.objectId) {
        const messageResult = await addGoogleLoyaltyObjectMessage({
          objectId: googleSync.objectId,
          header: '🎁 Canje solicitado',
          body: 'Tus sellos se reiniciaron. ¡Empieza tu siguiente recompensa!',
          messageId: `redeem_${Date.now()}`,
        });
        logApiEvent('/api/redeem/request#google-sync', messageResult.ok ? 'message_sent' : 'message_failed', {
          tenantId: normalizedTenantId,
          userId: normalizedUserId,
          objectId: googleSync.objectId,
          status: messageResult.status,
        });
      }
    } catch (googleError) {
      logApiError('/api/redeem/request#google-sync', googleError);
    }

    return apiSuccess({
      requestId,
      data: {
        success: true,
        code,
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String((error as { message?: string }).message || '');
      if (message.startsWith('sessionToken')) {
        return apiError({
          requestId,
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Sesión inválida, vuelve a iniciar sesión',
        });
      }
    }

    logApiError('/api/redeem/request', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: `Error técnico: ${error instanceof Error ? error.message : ''}`,
    });
  }
}
