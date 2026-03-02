import { timingSafeEqual } from 'crypto';

const DEFAULT_MASTER_USERNAME = 'master_root_puntoia';
const DEFAULT_MASTER_PASSWORD = 'G9v!2Qp#7Lm@4Xz%8Ta$1Nd';

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
  return configured && configured.length > 0 ? configured : DEFAULT_MASTER_USERNAME;
}

function getExpectedMasterPassword(): string {
  const configured = process.env.MASTER_PASSWORD?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_MASTER_PASSWORD;
}

export function isMasterPasswordConfigured(): boolean {
  return true;
}

export function isValidMasterCredentials(usernameInput: unknown, passwordInput: unknown): boolean {
  const providedUsername = String(usernameInput || '');
  const providedPassword = String(passwordInput || '');

  if (providedUsername.length === 0 || providedPassword.length === 0) {
    return false;
  }

  const expectedUsername = getExpectedMasterUsername();
  const expectedPassword = getExpectedMasterPassword();

  return secureCompare(providedUsername, expectedUsername) && secureCompare(providedPassword, expectedPassword);
}
