import { apiError, apiSuccess, getRequestId, type ApiErrorCode } from '@/app/lib/api-response';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { RewardPeriod } from '@prisma/client';
import { ensureWalletRegistrationsTable, touchWalletPassRegistrations, walletSerialNumber } from '@/app/lib/apple-wallet-webservice';
import {
  deleteWalletRegistrationsByPushToken,
  listWalletPushTokens,
  pushWalletUpdateToDevice,
  shouldDeleteWalletRegistrationForPushResult,
} from '@/app/lib/apple-wallet-push';
import { prisma } from '@/app/lib/prisma';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { asTrimmedString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { syncGoogleLoyaltyObjectForCustomer } from '@/app/lib/google-wallet-object-sync';
import { addGoogleLoyaltyObjectMessage } from '@/app/lib/google-wallet';
import { evaluateChallengesForVisit } from '@/app/lib/challenges';
import { isMissingTableOrColumnError } from '@/app/lib/prisma-error-helpers';
const TZ = 'America/Monterrey';

function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

function dayKeyInBusinessTz(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`; // para DailyCode.day
}

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return { y: parseInt(get('year'), 10), m: parseInt(get('month'), 10), day: parseInt(get('day'), 10) };
}

function periodKey(period: RewardPeriod, now = new Date()) {
  if (period === 'OPEN') return 'OPEN';
  const { y, m } = tzParts(now);
  if (period === 'MONTHLY') return `${y}-M${String(m).padStart(2, '0')}`;
  if (period === 'QUARTERLY') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (period === 'SEMESTER') return `${y}-S${m <= 6 ? 1 : 2}`;
  return `${y}-Y`;
}

function parsePurchaseAmount(value: unknown) {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(1000000, Math.max(0, Math.round(parsed * 100) / 100));
}

function parseTicketNumber(value: unknown) {
  const normalized = asTrimmedString(value).replace(/\s+/g, '').toUpperCase();
  if (!normalized) return '';
  return normalized.slice(0, 40);
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
      code: requiredString,
      tenantUserId: requiredString,
      tenantSessionToken: requiredString,
    });
    if (!parsedBody.ok) {
      logApiEvent('/api/check-in/scan', 'validation_error', { field: String(parsedBody.field) });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { userId, code, tenantUserId, tenantSessionToken } = parsedBody.data;
    const purchaseAmount = parsePurchaseAmount(body.purchaseAmount);
    const rawTicketNumber = parseTicketNumber(body.ticketNumber);

    const dayUTC = dayKeyInBusinessTz();

    const validCode = await (async () => {
      try {
        return await prisma.dailyCode.findFirst({
          where: { code, isActive: true, day: dayUTC },
          include: {
            tenant: {
              select: {
                id: true,
                isActive: true,
                name: true,
                requiredVisits: true,
                rewardPeriod: true,
                ticketControlEnabled: true,
              },
            },
          },
        });
      } catch (error: unknown) {
        if (!isMissingTableOrColumnError(error)) throw error;
        const fallback = await prisma.dailyCode.findFirst({
          where: { code, isActive: true, day: dayUTC },
          include: {
            tenant: {
              select: {
                id: true,
                isActive: true,
                name: true,
                requiredVisits: true,
                rewardPeriod: true,
              },
            },
          },
        });
        if (!fallback) return fallback;
        return {
          ...fallback,
          tenant: {
            ...fallback.tenant,
            ticketControlEnabled: false,
          },
        };
      }
    })();

    if (!validCode) {
      logApiEvent('/api/check-in/scan', 'invalid_code', { userId });
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Código inválido o no es de hoy',
      });
    }

    const access = await requireTenantRoleAccess({
      tenantId: validCode.tenantId,
      tenantUserId,
      tenantSessionToken,
      allowedRoles: ['ADMIN', 'STAFF'],
    });
    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    let membership = await prisma.membership.findFirst({
      where: { userId, tenantId: validCode.tenantId },
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          userId,
          tenantId: validCode.tenantId,
          currentVisits: 0,
          totalVisits: 0,
          periodKey: 'OPEN',
          periodType: 'OPEN',
        },
      });
    }

    // anti duplicado por día/negocio
    const visitDay = dayUTC;
    const alreadyToday = await prisma.visit.findFirst({
      where: { membershipId: membership.id, tenantId: validCode.tenantId, visitDay },
      select: { id: true },
    });
    if (alreadyToday) {
      logApiEvent('/api/check-in/scan', 'duplicate_visit', { userId, tenantId: validCode.tenantId, visitDay });
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: '¡Ya registraste tu visita hoy!',
      });
    }

    const now = new Date();
    const tenantPeriod = (validCode.tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    // cambio de regla: adoptar sin reset
    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    // expiración natural
    const curType = (membership.periodType as RewardPeriod) || 'OPEN';
    const curKey = periodKey(curType, now);

    if ((membership.periodKey || 'OPEN') !== curKey) {
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: curKey },
      });
    }

    const ticketControlEnabled =
      'ticketControlEnabled' in validCode.tenant
        ? Boolean((validCode.tenant as { ticketControlEnabled?: boolean }).ticketControlEnabled)
        : false;
    const ticketNumber = ticketControlEnabled ? rawTicketNumber : '';

    let updatedMembership;
    try {
      [, updatedMembership] = await prisma.$transaction([
        prisma.visit.create({
          data: {
            membershipId: membership.id,
            dailyCodeId: validCode.id,
            tenantId: validCode.tenantId,
            visitDay,
            purchaseAmount,
            ticketNumber: ticketNumber || null,
          },
          select: { id: true },
        }),
        prisma.membership.update({
          where: { id: membership.id },
          data: {
            currentVisits: { increment: 1 },
            totalVisits: { increment: 1 },
            lastVisitAt: new Date(),
          },
        }),
      ]);
    } catch (error: unknown) {
      if (!isMissingTableOrColumnError(error)) throw error;
      [, updatedMembership] = await prisma.$transaction([
        prisma.visit.create({
          data: {
            membershipId: membership.id,
            dailyCodeId: validCode.id,
            tenantId: validCode.tenantId,
            visitDay,
          },
          select: { id: true },
        }),
        prisma.membership.update({
          where: { id: membership.id },
          data: {
            currentVisits: { increment: 1 },
            totalVisits: { increment: 1 },
            lastVisitAt: new Date(),
          },
        }),
      ]);
    }


    try {
      await evaluateChallengesForVisit({ userId });
    } catch (challengeError) {
      logApiError('/api/check-in/scan#challenges', challengeError);
    }

    try {
      await ensureWalletRegistrationsTable(prisma);
      const serialNumber = walletSerialNumber(userId, validCode.tenantId);
      const passTypeIdentifier = asTrimmedString(process.env.APPLE_PASS_TYPE_ID) || undefined;

      await touchWalletPassRegistrations(prisma, {
        serialNumber,
        passTypeIdentifier,
      });

      if (passTypeIdentifier) {
        const pushTokens = await listWalletPushTokens(prisma, {
          serialNumber,
          passTypeIdentifier,
        });

        logApiEvent('/api/check-in/scan#wallet-push', 'push_start', {
          serialNumber,
          passTypeIdentifier,
          deviceCount: pushTokens.length,
        });

        for (const pushToken of pushTokens) {
          const result = await pushWalletUpdateToDevice(pushToken, passTypeIdentifier);
          if (result.ok) {
            logApiEvent('/api/check-in/scan#wallet-push', 'push_sent', {
              serialNumber,
              status: result.status,
              host: result.host || null,
            });
          } else {
            if (shouldDeleteWalletRegistrationForPushResult(result)) {
              await deleteWalletRegistrationsByPushToken(prisma, pushToken);
            }
            logApiEvent('/api/check-in/scan#wallet-push', 'push_failed', {
              serialNumber,
              status: result.status,
              reason: result.reason || 'unknown',
              host: result.host || null,
            });
          }
        }
      } else {
        logApiEvent('/api/check-in/scan#wallet-push', 'push_skipped', {
          reason: 'APPLE_PASS_TYPE_ID not configured',
        });
      }
    } catch (walletError) {
      logApiError('/api/check-in/scan#wallet-touch', walletError);
    }

    try {
      const googleSync = await syncGoogleLoyaltyObjectForCustomer({
        tenantId: validCode.tenantId,
        userId,
        origin: new URL(request.url).origin,
      });
      if (!googleSync.ok) {
        logApiEvent('/api/check-in/scan#google-sync', 'sync_skipped', {
          tenantId: validCode.tenantId,
          userId,
          reason: googleSync.reason,
          operation: googleSync.operation,
          status: googleSync.status,
        });
      } else if (googleSync.objectId) {
        const progress = `${updatedMembership.currentVisits}/${validCode.tenant.requiredVisits ?? 10}`;
        const messageId = `checkin_${Date.now()}`;
        const messageResult = await addGoogleLoyaltyObjectMessage({
          objectId: googleSync.objectId,
          header: '✅ Visita registrada',
          body: `Llevas ${progress} sellos`,
          messageId,
        });
        logApiEvent('/api/check-in/scan#google-sync', messageResult.ok ? 'message_sent' : 'message_failed', {
          tenantId: validCode.tenantId,
          userId,
          objectId: googleSync.objectId,
          status: messageResult.status,
        });
      }
    } catch (googleError) {
      logApiError('/api/check-in/scan#google-sync', googleError);
    }

    logApiEvent('/api/check-in/scan', 'visit_registered', { userId, tenantId: validCode.tenantId, visitDay });

    return apiSuccess({
      requestId,
      data: {
        success: true,
        visits: updatedMembership.currentVisits,
        requiredVisits: validCode.tenant.requiredVisits ?? 10,
        rewardPeriod: validCode.tenant.rewardPeriod,
        message: `¡Visita registrada en ${validCode.tenant.name}!`,
        purchaseAmount,
        ticketNumber: ticketNumber || '',
      },
    });

  } catch (error: unknown) {
    logApiError('/api/check-in/scan', error);
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error técnico',
    });
  }
}
