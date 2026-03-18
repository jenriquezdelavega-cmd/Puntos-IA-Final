export const DEFAULT_MILESTONE_EMOJI = '🎁';
export const DEFAULT_FINAL_MILESTONE_EMOJI = '🏆';
export const DEFAULT_FINAL_MILESTONE_REWARD = 'Premio Final';

export type MilestoneInputLike = {
  visitTarget?: number | string | null;
  reward?: string | null;
  emoji?: string | null;
};

export type NormalizedMilestone = {
  visitTarget: number;
  reward: string;
  emoji: string;
  isFinal: boolean;
};

type ValidationResult =
  | { ok: true; milestones: NormalizedMilestone[] }
  | { ok: false; message: string };

function parseVisitTarget(value: number | string | null | undefined): number {
  return Number.parseInt(String(value ?? ''), 10);
}

function sanitizeRequiredVisits(requiredVisits: number): number {
  return Number.isInteger(requiredVisits) && requiredVisits > 0 ? requiredVisits : 1;
}

export function normalizeMilestonesForEditor(rawMilestones: MilestoneInputLike[], requiredVisits: number) {
  const normalizedRequiredVisits = sanitizeRequiredVisits(requiredVisits);
  const intermediateMilestones = rawMilestones
    .filter((milestone) => parseVisitTarget(milestone.visitTarget) !== normalizedRequiredVisits)
    .map((milestone) => ({
      visitTarget: String(parseVisitTarget(milestone.visitTarget)),
      reward: String(milestone.reward ?? '').trim(),
      emoji: String(milestone.emoji ?? '').trim() || DEFAULT_MILESTONE_EMOJI,
    }))
    .sort((left, right) => Number.parseInt(left.visitTarget, 10) - Number.parseInt(right.visitTarget, 10));

  const finalMilestone = rawMilestones.find(
    (milestone) => parseVisitTarget(milestone.visitTarget) === normalizedRequiredVisits,
  );

  return {
    intermediateMilestones,
    finalMilestone: finalMilestone
      ? {
          visitTarget: normalizedRequiredVisits,
          reward: String(finalMilestone.reward ?? '').trim(),
          emoji: String(finalMilestone.emoji ?? '').trim() || DEFAULT_FINAL_MILESTONE_EMOJI,
        }
      : null,
  };
}

export function validateMilestonesPayload(
  rawMilestones: unknown,
  requiredVisits: number,
): ValidationResult {
  if (!Array.isArray(rawMilestones)) {
    return { ok: false, message: 'milestones debe ser un arreglo' };
  }

  const normalizedRequiredVisits = sanitizeRequiredVisits(requiredVisits);
  const parsed: NormalizedMilestone[] = [];
  const seenTargets = new Set<number>();

  for (const item of rawMilestones) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }

    const rec = item as MilestoneInputLike;
    const visitTarget = parseVisitTarget(rec.visitTarget);
    const reward = String(rec.reward ?? '').trim();
    const isFinal = visitTarget === normalizedRequiredVisits;
    const emoji = String(rec.emoji ?? '').trim() || (isFinal ? DEFAULT_FINAL_MILESTONE_EMOJI : DEFAULT_MILESTONE_EMOJI);

    if (Number.isNaN(visitTarget) || visitTarget < 1) {
      return { ok: false, message: `visitTarget inválido: ${String(rec.visitTarget ?? '')}` };
    }

    if (visitTarget > normalizedRequiredVisits) {
      return {
        ok: false,
        message: `El premio intermedio (visita ${visitTarget}) no puede ser mayor a la meta final (${normalizedRequiredVisits}).`,
      };
    }

    if (!reward) {
      return { ok: false, message: 'reward no puede estar vacío' };
    }

    if (seenTargets.has(visitTarget)) {
      return {
        ok: false,
        message: isFinal
          ? `Solo puede existir un premio final en la visita ${normalizedRequiredVisits}.`
          : `Ya existe un hito configurado para la visita ${visitTarget}.`,
      };
    }

    seenTargets.add(visitTarget);
    parsed.push({ visitTarget, reward, emoji, isFinal });
  }

  if (parsed.length > 20) {
    return { ok: false, message: 'Máximo 20 hitos por negocio' };
  }

  parsed.sort((left, right) => left.visitTarget - right.visitTarget);
  return { ok: true, milestones: parsed };
}

export function buildMilestonesPayloadForSave(params: {
  milestones: MilestoneInputLike[];
  requiredVisits: number;
  finalReward: string;
  finalEmoji: string;
}): ValidationResult {
  const normalizedRequiredVisits = sanitizeRequiredVisits(params.requiredVisits);
  const intermediateMilestones = params.milestones
    .filter((milestone) => String(milestone.visitTarget ?? '').trim() && String(milestone.reward ?? '').trim())
    .map((milestone) => ({
      visitTarget: parseVisitTarget(milestone.visitTarget),
      reward: String(milestone.reward ?? '').trim(),
      emoji: String(milestone.emoji ?? '').trim() || DEFAULT_MILESTONE_EMOJI,
    }));

  return validateMilestonesPayload(
    [
      ...intermediateMilestones,
      {
        visitTarget: normalizedRequiredVisits,
        reward: params.finalReward.trim() || DEFAULT_FINAL_MILESTONE_REWARD,
        emoji: params.finalEmoji.trim() || DEFAULT_FINAL_MILESTONE_EMOJI,
      },
    ],
    normalizedRequiredVisits,
  );
}
