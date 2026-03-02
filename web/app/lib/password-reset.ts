import { createHash, randomBytes } from 'crypto';

const RESET_TOKEN_TTL_MINUTES = 30;

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(String(token || '').trim()).digest('hex');
}

export function getPasswordResetExpiryDate(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);
}
