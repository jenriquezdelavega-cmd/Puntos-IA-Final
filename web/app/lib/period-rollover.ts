import { prisma } from '@/app/lib/prisma';

export async function resetMembershipForPeriodRollover(input: {
  membershipId: string;
  tenantId: string;
  userId: string;
  nextPeriodKey: string;
}) {
  const [updatedMembership, deletedPending] = await prisma.$transaction([
    prisma.membership.update({
      where: { id: input.membershipId },
      data: { currentVisits: 0, periodKey: input.nextPeriodKey },
    }),
    prisma.redemption.deleteMany({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        isUsed: false,
      },
    }),
  ]);

  return {
    membership: updatedMembership,
    deletedPendingRewards: deletedPending.count,
  };
}
