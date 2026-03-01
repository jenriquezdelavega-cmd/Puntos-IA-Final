import { timingSafeEqual } from 'crypto';

function secureCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function isMasterPasswordConfigured(): boolean {
  return typeof process.env.MASTER_PASSWORD === 'string' && process.env.MASTER_PASSWORD.trim().length > 0;
}

export function isValidMasterPassword(input: unknown): boolean {
  const provided = String(input || '');
  const expected = process.env.MASTER_PASSWORD;

  if (!expected || !isMasterPasswordConfigured()) {
    return false;
  }

  if (provided.length === 0) {
    return false;
  }

  return secureCompare(provided, expected);
}
