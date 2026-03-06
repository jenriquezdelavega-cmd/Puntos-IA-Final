import { prisma } from '@/app/lib/prisma';
import { ChallengeProgressStatus, ChallengeType } from '@prisma/client';

function windowStartFromDays(days: number) {
  const now = new Date();
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 1;
  return new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);
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

    let progressValue = 0;

    if (challenge.challengeType === ChallengeType.VISIT_COUNT) {
      progressValue = await prisma.visit.count({
        where: {
          membership: { userId },
          visitedAt: { gte: start },
        },
      });
    } else if (challenge.challengeType === ChallengeType.DISTINCT_BUSINESSES) {
      const visitedTenants = await prisma.visit.findMany({
        where: {
          membership: { userId },
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
