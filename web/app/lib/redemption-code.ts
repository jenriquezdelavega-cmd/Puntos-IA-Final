import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';

const REDEMPTION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REDEMPTION_CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 10;

function createRedemptionCodeCandidate() {
  let code = '';
  for (let i = 0; i < REDEMPTION_CODE_LENGTH; i++) {
    code += REDEMPTION_CODE_ALPHABET[crypto.randomInt(0, REDEMPTION_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeRedemptionCode(raw: string) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, REDEMPTION_CODE_LENGTH);
}

export function isValidRedemptionCode(code: string) {
  return /^[A-Z0-9]{8}$/.test(String(code || ''));
}

export async function generateUniqueRedemptionCode(tenantId: string) {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = createRedemptionCodeCandidate();
    const existing = await prisma.redemption.findFirst({
      where: {
        tenantId,
        code,
        isUsed: false,
      },
      select: { id: true },
    });
    if (!existing) return code;
  }

  throw new Error('No se pudo generar un código de canje único');
}
