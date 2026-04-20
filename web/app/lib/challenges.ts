import { prisma } from '@/app/lib/prisma';
import { ChallengeProgressStatus, ChallengeType } from '@prisma/client';

function windowStartFromDays(days: number) {
  const now = new Date();
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 1;
  return new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);
}

type MissionFilters = {
  businessCategory?: string;
  coalitionOnly?: boolean;
};

function parseMissionFilters(rawText: string): MissionFilters {
  const text = String(rawText || '');
  const categoryMatch = text.match(/\[(?:categoria|category)\s*:\s*([^[\]]+)\]/i);
  const coalitionOnlyMatch = text.match(/\[(?:solo_coalicion|coalition_only)\s*:\s*(true|false|1|0|si|no)\]/i);

  const businessCategory = categoryMatch?.[1]?.trim();
  const rawCoalitionOnly = coalitionOnlyMatch?.[1]?.trim().toLowerCase();
  const coalitionOnly =
    rawCoalitionOnly === 'true' || rawCoalitionOnly === '1' || rawCoalitionOnly === 'si'
      ? true
      : rawCoalitionOnly === 'false' || rawCoalitionOnly === '0' || rawCoalitionOnly === 'no'
        ? false
        : undefined;

  return {
    ...(businessCategory ? { businessCategory } : {}),
    ...(coalitionOnly !== undefined ? { coalitionOnly } : {}),
  };
}

export async function evaluateChallengesForVisit(params: { userId: string }) {
  const { userId } = params;

  const activeChallenges = await prisma.challenge.findMany({
    where: { active: true },
    include: {
      rewardCampaign: {
        include: { business: { select: { id: true, name: true } } },
      },
    },
  });

  if (activeChallenges.length === 0) {
    return { updated: 0, completed: 0, unlockedRewards: 0 };
  }

  let updated = 0;
  let completed = 0;
  let unlockedRewards = 0;

  for (const challenge of activeChallenges) {
    const start = windowStartFromDays(challenge.timeWindow);
    const missionFilters = parseMissionFilters(`${challenge.title}\n${challenge.description}`);

    const tenantFilter = {
      ...(missionFilters.businessCategory ? { businessCategory: missionFilters.businessCategory } : {}),
      ...(missionFilters.coalitionOnly === true ? { coalitionOptIn: true } : {}),
    };

    let progressValue = 0;

    if (challenge.challengeType === ChallengeType.VISIT_COUNT) {
      progressValue = await prisma.visit.count({
        where: {
          membership: {
            userId,
            ...(Object.keys(tenantFilter).length > 0 ? { tenant: tenantFilter } : {}),
          },
          visitedAt: { gte: start },
        },
      });
    } else if (challenge.challengeType === ChallengeType.DISTINCT_BUSINESSES) {
      const visitedTenants = await prisma.visit.findMany({
        where: {
          membership: {
            userId,
            ...(Object.keys(tenantFilter).length > 0 ? { tenant: tenantFilter } : {}),
          },
          visitedAt: { gte: start },
        },
        distinct: ['tenantId'],
        select: { tenantId: true },
      });
      progressValue = visitedTenants.length;
    }

    const isCompletedNow = progressValue >= challenge.targetValue;

    await prisma.customerChallengeProgress.upsert({
      where: {
        customerId_challengeId: {
          customerId: userId,
          challengeId: challenge.id,
        },
      },
      create: {
        customerId: userId,
        challengeId: challenge.id,
        progressValue,
        status: isCompletedNow ? ChallengeProgressStatus.COMPLETED : ChallengeProgressStatus.IN_PROGRESS,
        completedAt: isCompletedNow ? new Date() : null,
      },
      update: {
        progressValue,
        status: isCompletedNow ? ChallengeProgressStatus.COMPLETED : ChallengeProgressStatus.IN_PROGRESS,
        completedAt: isCompletedNow ? new Date() : null,
      },
    });

    updated += 1;

    if (isCompletedNow) {
      completed += 1;
      if (challenge.rewardCampaignId) {
        await prisma.customerCoalitionReward.upsert({
          where: {
            customerId_rewardId: {
              customerId: userId,
              rewardId: challenge.rewardCampaignId,
            },
          },
          create: {
            customerId: userId,
            rewardId: challenge.rewardCampaignId,
          },
          update: {},
        });
        unlockedRewards += 1;
      }
    }
  }

  return { updated, completed, unlockedRewards };
}
