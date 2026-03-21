import { createHash, randomInt, randomUUID } from 'node:crypto';
import { asTrimmedString, normalizePhone } from '@/app/lib/request-validation';

type SendOtpResult = {
  ok: boolean;
  error?: string;
};

type SendOtpContext = {
  name?: string | null;
  placeholders?: Array<string | null | undefined>;
};

function readEnv(name: string) {
  return String(process.env[name] || '').trim();
}

function getInfobipWhatsappConfig() {
  const enabled = readEnv('INFOBIP_VERIFY_ENABLED') === 'true';
  const apiKey = readEnv('INFOBIP_API_KEY');
  const baseUrl = readEnv('INFOBIP_BASE_URL');
  const from = readEnv('INFOBIP_WHATSAPP_FROM');
  const templateName = readEnv('INFOBIP_WHATSAPP_TEMPLATE_NAME') || readEnv('INFOBIP_WHATSAPP_TEMPLATE_ID');
  const language = readEnv('INFOBIP_WHATSAPP_LANGUAGE') || 'en';

  if (!enabled || !apiKey || !baseUrl || !from || !templateName) {
    return null;
  }

  const normalizedBase = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  return {
    apiKey,
    baseUrl: normalizedBase.replace(/\/$/, ''),
    from,
    templateName,
    language,
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

  if (/^[0-9]{11}$/.test(normalized) && normalized.startsWith('1')) {
    return `+52${normalized.slice(1)}`;
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

function buildTemplatePlaceholders(code: string, context: SendOtpContext = {}) {
  if (Array.isArray(context.placeholders) && context.placeholders.length > 0) {
    return context.placeholders.map((value) => asTrimmedString(value));
  }

  const configuredOrder = readEnv('INFOBIP_WHATSAPP_TEMPLATE_PLACEHOLDERS');
  if (!configuredOrder) return [asTrimmedString(code)];

  const keys = configuredOrder
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (!keys.length) return [asTrimmedString(code)];

  return keys.map((key) => {
    if (key === 'code' || key === 'otp') return asTrimmedString(code);
    if (key === 'name') return asTrimmedString(context.name);
    return '';
  });
}

export async function sendWhatsAppVerificationCode(phoneInput: string, code: string, context: SendOtpContext = {}): Promise<SendOtpResult> {
  const config = getInfobipWhatsappConfig();
  if (!config) return { ok: false, error: 'PHONE_VERIFICATION_NOT_CONFIGURED' };

  const to = toE164Phone(phoneInput);
  if (!to) return { ok: false, error: 'PHONE_INVALID' };

  const normalizedLanguage = asTrimmedString(config.language);
  const baseLanguage = normalizedLanguage.split(/[-_]/)[0] || '';
  const languageCandidates = Array.from(new Set([normalizedLanguage, baseLanguage, 'en'].filter(Boolean)));
  const placeholders = buildTemplatePlaceholders(code, context);
  let lastError = 'INFOBIP_HTTP_400';

  for (const language of languageCandidates) {
    const payload = {
      messages: [
        {
          from: config.from,
          to: to.replace('+', ''),
          messageId: randomUUID(),
          content: {
            templateName: config.templateName,
            language,
            templateData: {
              body: {
                placeholders,
              },
            },
          },
        },
      ],
    };

    const response = await fetch(`${config.baseUrl}/whatsapp/1/message/template`, {
      method: 'POST',
      headers: {
        Authorization: `App ${config.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { ok: true };
    }

    let bodyMessage = '';
    try {
      bodyMessage = await response.text();
    } catch {
      bodyMessage = '';
    }

    const compactBodyMessage = bodyMessage.replace(/\s+/g, ' ').trim().slice(0, 180);
    lastError = compactBodyMessage
      ? `INFOBIP_HTTP_${response.status}:${compactBodyMessage}`
      : `INFOBIP_HTTP_${response.status}`;
  }

  return { ok: false, error: lastError };
}
