import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_TOTP_WINDOW_STEPS = 4;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

function secureCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function getExpectedMasterUsername(): string {
  const configured = process.env.MASTER_USERNAME?.trim();
  return configured && configured.length > 0 ? configured : '';
}

function getExpectedMasterPassword(): string {
  const configured = process.env.MASTER_PASSWORD?.trim();
  return configured && configured.length > 0 ? configured : '';
}

function getMasterTotpSecret(): string {
  return (process.env.MASTER_TOTP_SECRET || '').replace(/\s+/g, '').toUpperCase();
}

function isTotpEnabled(): boolean {
  return getMasterTotpSecret().length > 0;
}

function getTotpWindowSteps(): number {
  const configured = Number.parseInt((process.env.MASTER_TOTP_WINDOW_STEPS || '').trim(), 10);
  if (Number.isFinite(configured) && configured >= 0 && configured <= 10) {
    return configured;
  }
  return DEFAULT_TOTP_WINDOW_STEPS;
}

function normalizeOtp(value: unknown): string {
  return String(value || '').replace(/\s+/g, '');
}

function decodeBase32(secret: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  for (const char of secret.replace(/=+$/g, '')) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('MASTER_TOTP_SECRET inválido: debe estar en Base32');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  const otp = binaryCode % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

function isValidTotpOtp(otpInput: unknown): boolean {
  const provided = normalizeOtp(otpInput);
  if (!/^\d{6}$/.test(provided)) return false;

  const secret = decodeBase32(getMasterTotpSecret());
  const nowCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  const windowSteps = getTotpWindowSteps();

  for (let step = -windowSteps; step <= windowSteps; step += 1) {
    const expected = hotp(secret, nowCounter + step);
    if (secureCompare(provided, expected)) {
      return true;
    }
  }

  return false;
}

export function isMasterPasswordConfigured(): boolean {
  return getExpectedMasterUsername().length > 0 && getExpectedMasterPassword().length > 0;
}

export function isValidMasterCredentials(usernameInput: unknown, passwordInput: unknown, otpInput?: unknown): boolean {
  if (!isMasterPasswordConfigured()) {
    return false;
  }

  const providedUsername = String(usernameInput || '');
  const providedPassword = String(passwordInput || '');

  if (providedUsername.length === 0 || providedPassword.length === 0) {
    return false;
  }

  const expectedUsername = getExpectedMasterUsername();
  const expectedPassword = getExpectedMasterPassword();
  const passwordOk = secureCompare(providedUsername, expectedUsername) && secureCompare(providedPassword, expectedPassword);

  if (!passwordOk) return false;
  if (!isTotpEnabled()) return true;

  return isValidTotpOtp(otpInput);
}
