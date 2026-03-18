export const DEFAULT_REQUIRED_VISITS = 10;
export const MAX_REQUIRED_VISITS = 12;
export const MIN_REQUIRED_VISITS = 1;

export function sanitizeRequiredVisits(value: unknown, fallback = DEFAULT_REQUIRED_VISITS): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) {
    return Math.min(MAX_REQUIRED_VISITS, Math.max(MIN_REQUIRED_VISITS, fallback));
  }

  return Math.min(MAX_REQUIRED_VISITS, Math.max(MIN_REQUIRED_VISITS, parsed));
}

export function parseOptionalRequiredVisits(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return sanitizeRequiredVisits(value);
}
