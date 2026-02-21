const DEFAULT_MASTER_PASSWORD = 'superadmin2026';

export function isValidMasterPassword(input: unknown): boolean {
  const provided = String(input || '');
  const expected = process.env.MASTER_PASSWORD || DEFAULT_MASTER_PASSWORD;
  return provided.length > 0 && provided === expected;
}
