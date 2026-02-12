import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function hashPassword(rawPassword: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(rawPassword, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function isHashedPassword(value: string): boolean {
  return value.startsWith('scrypt$');
}

export function verifyPassword(rawPassword: string, storedPassword: string): boolean {
  if (!isHashedPassword(storedPassword)) {
    return rawPassword === storedPassword;
  }

  const [, salt, storedHash] = storedPassword.split('$');
  if (!salt || !storedHash) return false;

  const derived = scryptSync(rawPassword, salt, KEY_LENGTH);
  const hashBuffer = Buffer.from(storedHash, 'hex');

  if (derived.length !== hashBuffer.length) return false;
  return timingSafeEqual(derived, hashBuffer);
}
