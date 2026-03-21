import { createHash, randomInt } from 'node:crypto';
import { asTrimmedString, normalizePhone } from '@/app/lib/request-validation';

type SendOtpResult = {
  ok: boolean;
  error?: string;
};

function readEnv(name: string) {
  return String(process.env[name] || '').trim();
}

function getInfobipWhatsappConfig() {
  const enabled = readEnv('INFOBIP_VERIFY_ENABLED') === 'true';
  const apiKey = readEnv('INFOBIP_API_KEY');
  const baseUrl = readEnv('INFOBIP_BASE_URL');
  const from = readEnv('INFOBIP_WHATSAPP_FROM');
  const templateId = readEnv('INFOBIP_WHATSAPP_TEMPLATE_ID');

  if (!enabled || !apiKey || !baseUrl || !from || !templateId) {
    return null;
  }

  const normalizedBase = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  return {
    apiKey,
    baseUrl: normalizedBase.replace(/\/$/, ''),
    from,
    templateId,
  };
}

export function isPhoneVerificationEnabled() {
  return getInfobipWhatsappConfig() !== null;
}

export function isPhoneVerificationRequired() {
  return readEnv('PHONE_VERIFICATION_REQUIRED') === 'true';
}

export function toE164Phone(phoneInput: string) {
  const raw = asTrimmedString(phoneInput);
  if (!raw) return '';
  if (raw.startsWith('+') && /^\+[1-9][0-9]{7,14}$/.test(raw)) return raw;

  const normalized = normalizePhone(raw);
  if (!normalized) return '';

  if (/^[0-9]{10}$/.test(normalized)) {
    return `+52${normalized}`;
  }

  if (/^[0-9]{12}$/.test(normalized) && normalized.startsWith('52')) {
    return `+${normalized}`;
  }

  if (/^[0-9]{11,15}$/.test(normalized)) {
    return `+${normalized}`;
  }

  return '';
}

export function generatePhoneVerificationCode() {
  return String(randomInt(100000, 999999));
}

export function hashPhoneVerificationCode(code: string) {
  return createHash('sha256').update(asTrimmedString(code)).digest('hex');
}

export function isPhoneVerificationCodeMatch(code: string, codeHash: string) {
  return hashPhoneVerificationCode(code) === asTrimmedString(codeHash);
}

export async function sendWhatsAppVerificationCode(phoneInput: string, code: string): Promise<SendOtpResult> {
  const config = getInfobipWhatsappConfig();
  if (!config) return { ok: false, error: 'PHONE_VERIFICATION_NOT_CONFIGURED' };

  const to = toE164Phone(phoneInput);
  if (!to) return { ok: false, error: 'PHONE_INVALID' };

  const response = await fetch(`${config.baseUrl}/whatsapp/1/message/template`, {
    method: 'POST',
    headers: {
      Authorization: `App ${config.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          from: config.from,
          to: to.replace('+', ''),
          messageId: config.templateId,
          content: {
            templateData: {
              body: {
                placeholders: [asTrimmedString(code)],
              },
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    return { ok: false, error: `INFOBIP_HTTP_${response.status}` };
  }

  return { ok: true };
}
