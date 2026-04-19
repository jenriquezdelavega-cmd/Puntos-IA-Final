export function normalizeInstagramUrl(raw?: string | null) {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (/^(www\.)?instagram\.com\//i.test(value)) return `https://${value.replace(/^https?:\/\//i, '')}`;

  const handle = value.replace(/^@/, '');
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

export function sortedBusinessTags(category?: string, prize?: string) {
  return [
    category || '',
    prize ? `🎁 ${prize}` : '',
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}
