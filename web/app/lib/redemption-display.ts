type MilestoneLike = {
  reward?: string | null;
  emoji?: string | null;
} | null | undefined;

type CoalitionRewardLike = {
  title?: string | null;
  rewardValue?: string | null;
} | null | undefined;

type CoalitionUnlockLike = {
  reward?: CoalitionRewardLike;
} | null | undefined;

type RedemptionDisplayInput = {
  tenantPrize?: string | null;
  rewardSnapshot?: string | null;
  code?: string | null;
  loyaltyMilestone?: MilestoneLike;
  coalitionRewardUnlock?: CoalitionUnlockLike;
};

export function getRedemptionChannel(params: {
  loyaltyMilestoneId?: string | null;
  coalitionRewardUnlockId?: string | null;
}): 'FINAL' | 'MILESTONE' | 'COALITION' {
  if (params.coalitionRewardUnlockId) return 'COALITION';
  if (params.loyaltyMilestoneId) return 'MILESTONE';
  return 'FINAL';
}

export function getRedemptionRewardLabel(input: RedemptionDisplayInput): string {
  const rewardSnapshot = String(input.rewardSnapshot ?? '').trim();
  if (rewardSnapshot) return rewardSnapshot;

  const milestoneReward = String(input.loyaltyMilestone?.reward ?? '').trim();
  if (milestoneReward) {
    const milestoneEmoji = String(input.loyaltyMilestone?.emoji ?? '').trim();
    return `${milestoneEmoji ? `${milestoneEmoji} ` : ''}${milestoneReward}`;
  }

  const coalitionTitle = String(input.coalitionRewardUnlock?.reward?.title ?? '').trim();
  if (coalitionTitle) {
    const coalitionValue = String(input.coalitionRewardUnlock?.reward?.rewardValue ?? '').trim();
    return coalitionValue ? `${coalitionTitle} · ${coalitionValue}` : coalitionTitle;
  }

  const tenantPrize = String(input.tenantPrize ?? '').trim();
  if (tenantPrize) return tenantPrize;

  const code = String(input.code ?? '').trim();
  if (code) return `Canje ${code}`;

  return 'Premio';
}
