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
import { generateUniqueRedemptionCode } from '@/app/lib/redemption-code';
import { sendRedemptionRequestedEmail } from '@/app/lib/email';
import { periodKey } from '@/app/lib/reward-period';
import { resetMembershipForPeriodRollover } from '@/app/lib/period-rollover';
import { maybeSendPeriodExpiryPush } from '@/app/lib/period-expiry-push';
import { after } from 'next/server';
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

function formatRewardValidityLabel(period: string | null | undefined) {
  switch (String(period || 'OPEN')) {
    case 'MONTHLY':
      return 'Válido durante el mes en curso';
    case 'QUARTERLY':
      return 'Válido durante el trimestre en curso';
    case 'SEMESTER':
      return 'Válido durante el semestre en curso';
    case 'ANNUAL':
      return 'Válido durante el año en curso';
    default:
      return 'Sin vigencia por periodo';
  }
}

function normalizeRewardLabel(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
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
                prize: true,
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
                prize: true,
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
      const rollover = await resetMembershipForPeriodRollover({
        membershipId: membership.id,
        tenantId: validCode.tenantId,
        userId,
        nextPeriodKey: curKey,
      });
      membership = rollover.membership;
      logApiEvent('/api/check-in/scan', 'period_rollover_reset', {
        userId,
        tenantId: validCode.tenantId,
        nextPeriodKey: curKey,
        deletedPendingRewards: rollover.deletedPendingRewards,
      });
    }

    const ticketControlEnabled =
      'ticketControlEnabled' in validCode.tenant
        ? Boolean((validCode.tenant as { ticketControlEnabled?: boolean }).ticketControlEnabled)
        : false;
    const ticketNumber = ticketControlEnabled ? rawTicketNumber : '';

    let createdVisit: { id: string } | null = null;
    let updatedMembership;
    try {
      [createdVisit, updatedMembership] = await prisma.$transaction([
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
      [createdVisit, updatedMembership] = await prisma.$transaction([
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

    const requiredVisits = validCode.tenant.requiredVisits ?? 10;
    const shouldResetVisitsAfterCheckIn = membership.currentVisits >= requiredVisits
      && Boolean(
        await prisma.redemption.findFirst({
          where: {
            userId,
            tenantId: validCode.tenantId,
            isUsed: false,
            loyaltyMilestoneId: null,
            coalitionRewardUnlockId: null,
          },
          select: { id: true },
        }),
      );
    const rewardReachedNow = updatedMembership.currentVisits >= requiredVisits;

    if (shouldResetVisitsAfterCheckIn) {
      updatedMembership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0 },
      });
      logApiEvent('/api/check-in/scan', 'post_reward_checkin_counter_reset', {
        userId,
        tenantId: validCode.tenantId,
        membershipId: membership.id,
      });
    }

    if (rewardReachedNow) {
      const existingPendingMainReward = await prisma.redemption.findFirst({
        where: {
          userId,
          tenantId: validCode.tenantId,
          isUsed: false,
          loyaltyMilestoneId: null,
          coalitionRewardUnlockId: null,
        },
        select: {
          id: true,
          code: true,
          rewardSnapshot: true,
          redemptionEmailSentAt: true,
        },
      });

      const rewardSnapshot = String(validCode.tenant.prize ?? '').trim() || null;
      let pendingCode = existingPendingMainReward?.code ?? null;

      if (!existingPendingMainReward) {
        const generatedCode = await generateUniqueRedemptionCode(validCode.tenantId);
        const createdRedemption = await prisma.redemption.create({
          data: {
            code: generatedCode,
            userId,
            tenantId: validCode.tenantId,
            isUsed: false,
            rewardSnapshot,
            earnedVisitId: createdVisit?.id ?? null,
          },
          select: {
            id: true,
            code: true,
            redemptionEmailSentAt: true,
          },
        });
        pendingCode = createdRedemption.code;
        logApiEvent('/api/check-in/scan', 'reward_code_auto_created', {
          userId,
          tenantId: validCode.tenantId,
          redemptionId: createdRedemption.id,
          code: createdRedemption.code,
          earnedVisitId: createdVisit?.id ?? null,
        });
      } else if (!String(existingPendingMainReward.rewardSnapshot ?? '').trim() && rewardSnapshot) {
        await prisma.redemption.update({
          where: { id: existingPendingMainReward.id },
          data: { rewardSnapshot, earnedVisitId: createdVisit?.id ?? null },
        });
      }

      if (pendingCode) {
        try {
          const customer = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
          });
          const hasEmail = Boolean(customer?.email && customer.email.trim());
          if (hasEmail && !existingPendingMainReward?.redemptionEmailSentAt) {
            const emailResult = await sendRedemptionRequestedEmail({
              to: String(customer?.email).trim(),
              name: customer?.name,
              businessName: validCode.tenant.name,
              rewardName: String(validCode.tenant.prize || 'Recompensa'),
              code: pendingCode,
            });
            if (!emailResult.ok) {
              logApiEvent('/api/check-in/scan', 'reward_code_email_failed', {
                userId,
                tenantId: validCode.tenantId,
                reason: emailResult.error || 'unknown',
              });
            } else {
              await prisma.redemption.updateMany({
                where: { code: pendingCode, tenantId: validCode.tenantId },
                data: { redemptionEmailSentAt: new Date() },
              });
            }
          }
        } catch (rewardEmailError) {
          logApiError('/api/check-in/scan#reward-email', rewardEmailError, {
            userId,
            tenantId: validCode.tenantId,
          });
        }
      }
    }

    const unlockedMilestones = await prisma.loyaltyMilestone.findMany({
      where: {
        tenantId: validCode.tenantId,
        visitTarget: {
          lte: updatedMembership.currentVisits,
          lt: requiredVisits,
        },
      },
      orderBy: { visitTarget: 'asc' },
      select: {
        id: true,
        visitTarget: true,
        reward: true,
        emoji: true,
      },
    });

    if (unlockedMilestones.length > 0) {
      const latestMainRewardRedemption = await prisma.redemption.findFirst({
        where: {
          userId,
          tenantId: validCode.tenantId,
          isUsed: true,
          loyaltyMilestoneId: null,
          coalitionRewardUnlockId: null,
        },
        select: { usedAt: true, createdAt: true },
        orderBy: [{ usedAt: 'desc' }, { createdAt: 'desc' }],
      });
      const cycleStartAt = latestMainRewardRedemption
        ? (latestMainRewardRedemption.usedAt ?? latestMainRewardRedemption.createdAt)
        : null;
      const [existingMilestoneRedemptions, customer] = await Promise.all([
        prisma.redemption.findMany({
          where: {
            userId,
            tenantId: validCode.tenantId,
            loyaltyMilestoneId: { not: null },
          },
          select: {
            code: true,
            isUsed: true,
            usedAt: true,
            createdAt: true,
            loyaltyMilestoneId: true,
            rewardSnapshot: true,
            redemptionEmailSentAt: true,
            loyaltyMilestone: {
              select: {
                visitTarget: true,
                reward: true,
                emoji: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        }),
      ]);

      const pendingByMilestone = new Map<string, { code: string; emailSentAt: Date | null }>();
      const pendingByVisitTarget = new Set<number>();
      const pendingByRewardLabel = new Set<string>();
      const usedInCycleByMilestone = new Set<string>();
      const usedInCycleByVisitTarget = new Set<number>();
      const usedInCycleByRewardLabel = new Set<string>();

      existingMilestoneRedemptions.forEach((redemption) => {
        const milestoneId = String(redemption.loyaltyMilestoneId ?? '');
        const milestoneTarget = Number(redemption.loyaltyMilestone?.visitTarget ?? 0);
        const snapshotLabel = normalizeRewardLabel(redemption.rewardSnapshot);
        const milestoneRewardLabel = normalizeRewardLabel(
          `${redemption.loyaltyMilestone?.emoji ? `${redemption.loyaltyMilestone.emoji} ` : ''}${redemption.loyaltyMilestone?.reward ?? ''}`,
        );

        if (!milestoneId) return;
        if (!redemption.isUsed && !pendingByMilestone.has(milestoneId)) {
          pendingByMilestone.set(milestoneId, { code: redemption.code, emailSentAt: redemption.redemptionEmailSentAt });
          if (Number.isFinite(milestoneTarget) && milestoneTarget > 0) {
            pendingByVisitTarget.add(milestoneTarget);
          }
          if (snapshotLabel) pendingByRewardLabel.add(snapshotLabel);
          if (milestoneRewardLabel) pendingByRewardLabel.add(milestoneRewardLabel);
          return;
        }
        if (redemption.isUsed) {
          const redeemedAt = redemption.usedAt ?? redemption.createdAt;
          if (!cycleStartAt || redeemedAt > cycleStartAt) {
            usedInCycleByMilestone.add(milestoneId);
            if (Number.isFinite(milestoneTarget) && milestoneTarget > 0) {
              usedInCycleByVisitTarget.add(milestoneTarget);
            }
            if (snapshotLabel) usedInCycleByRewardLabel.add(snapshotLabel);
            if (milestoneRewardLabel) usedInCycleByRewardLabel.add(milestoneRewardLabel);
          }
        }
      });

      for (const milestone of unlockedMilestones) {
        const milestoneLabel = normalizeRewardLabel(`${milestone.emoji ? `${milestone.emoji} ` : ''}${milestone.reward}`);
        const blockedByPending = pendingByMilestone.has(milestone.id)
          || pendingByVisitTarget.has(milestone.visitTarget)
          || pendingByRewardLabel.has(milestoneLabel);
        const blockedByUsed = usedInCycleByMilestone.has(milestone.id)
          || usedInCycleByVisitTarget.has(milestone.visitTarget)
          || usedInCycleByRewardLabel.has(milestoneLabel);

        if (blockedByPending || blockedByUsed) {
          logApiEvent('/api/check-in/scan', 'milestone_reward_auto_create_skipped_existing', {
            userId,
            tenantId: validCode.tenantId,
            milestoneId: milestone.id,
            visitTarget: milestone.visitTarget,
            blockedByPending,
            blockedByUsed,
          });
          continue;
        }

        const generatedMilestoneCode = await generateUniqueRedemptionCode(validCode.tenantId);
        const milestoneReward = `${milestone.emoji ? `${milestone.emoji} ` : ''}${milestone.reward}`.trim();
        await prisma.redemption.create({
          data: {
            code: generatedMilestoneCode,
            userId,
            tenantId: validCode.tenantId,
            isUsed: false,
            loyaltyMilestoneId: milestone.id,
            rewardSnapshot: milestoneReward || milestone.reward,
            earnedVisitId: createdVisit?.id ?? null,
          },
        });
        logApiEvent('/api/check-in/scan', 'milestone_reward_code_auto_created', {
          userId,
          tenantId: validCode.tenantId,
          milestoneId: milestone.id,
          visitTarget: milestone.visitTarget,
          code: generatedMilestoneCode,
          earnedVisitId: createdVisit?.id ?? null,
        });

        const hasEmail = Boolean(customer?.email && customer.email.trim());
        if (!hasEmail) {
          continue;
        }
        const emailResult = await sendRedemptionRequestedEmail({
          to: String(customer?.email).trim(),
          name: customer?.name,
          businessName: validCode.tenant.name,
          code: generatedMilestoneCode,
          rewardName: milestoneReward || milestone.reward,
          validityLabel: formatRewardValidityLabel(validCode.tenant.rewardPeriod),
        });
        if (!emailResult.ok) {
          logApiEvent('/api/check-in/scan', 'milestone_reward_code_email_failed', {
            userId,
            tenantId: validCode.tenantId,
            milestoneId: milestone.id,
            reason: emailResult.error || 'unknown',
          });
        } else {
          await prisma.redemption.updateMany({
            where: { code: generatedMilestoneCode, tenantId: validCode.tenantId },
            data: { redemptionEmailSentAt: new Date() },
          });
        }
      }
    }


    try {
      await evaluateChallengesForVisit({ userId });
    } catch (challengeError) {
      logApiError('/api/check-in/scan#challenges', challengeError);
    }

    const requestOrigin = new URL(request.url).origin;

    const backgroundWork = async () => {
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
        await maybeSendPeriodExpiryPush({
          tenantId: validCode.tenantId,
          origin: requestOrigin,
        });
      } catch (periodPushError) {
        logApiError('/api/check-in/scan#period-expiry-push', periodPushError, {
          tenantId: validCode.tenantId,
          userId,
        });
      }

      try {
        const googleSync = await syncGoogleLoyaltyObjectForCustomer({
          tenantId: validCode.tenantId,
          userId,
          origin: requestOrigin,
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
    };

    try {
      after(backgroundWork);
    } catch (afterError) {
      logApiError('/api/check-in/scan#after', afterError);
      void backgroundWork();
    }

    logApiEvent('/api/check-in/scan', 'visit_registered', { userId, tenantId: validCode.tenantId, visitDay });

    return apiSuccess({
      requestId,
      data: {
        success: true,
        visits: updatedMembership.currentVisits,
        requiredVisits,
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
