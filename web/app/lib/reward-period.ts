import { RewardPeriod } from '@prisma/client';

export const BUSINESS_TZ = 'America/Monterrey';

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return {
    y: parseInt(get('year'), 10),
    m: parseInt(get('month'), 10),
    d: parseInt(get('day'), 10),
  };
}

export function periodKey(period: RewardPeriod, now = new Date()) {
  if (period === 'OPEN') return 'OPEN';
  const { y, m } = tzParts(now);
  if (period === 'MONTHLY') return `${y}-M${String(m).padStart(2, '0')}`;
  if (period === 'QUARTERLY') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (period === 'SEMESTER') return `${y}-S${m <= 6 ? 1 : 2}`;
  return `${y}-Y`;
}

function endOfPeriod(period: RewardPeriod, now = new Date()) {
  const { y, m } = tzParts(now);
  if (period === 'OPEN') return null;
  if (period === 'MONTHLY') return { year: y, month: m, day: new Date(Date.UTC(y, m, 0)).getUTCDate() };
  if (period === 'QUARTERLY') {
    const quarterEndMonth = Math.floor((m - 1) / 3) * 3 + 3;
    return { year: y, month: quarterEndMonth, day: new Date(Date.UTC(y, quarterEndMonth, 0)).getUTCDate() };
  }
  if (period === 'SEMESTER') {
    const semesterEndMonth = m <= 6 ? 6 : 12;
    return { year: y, month: semesterEndMonth, day: new Date(Date.UTC(y, semesterEndMonth, 0)).getUTCDate() };
  }
  return { year: y, month: 12, day: 31 };
}

export function daysUntilPeriodEnds(period: RewardPeriod, now = new Date()) {
  const end = endOfPeriod(period, now);
  if (!end) return null;
  const today = tzParts(now);
  const startUtc = Date.UTC(today.y, today.m - 1, today.d);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.floor((endUtc - startUtc) / 86_400_000);
}
