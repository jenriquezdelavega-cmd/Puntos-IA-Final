import nodemailer from 'nodemailer';
import { logApiError, logApiEvent } from '@/app/lib/api-log';

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailSendResult = {
  ok: boolean;
  skipped: boolean;
  messageId?: string;
  error?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;
let verifyPromise: Promise<void> | null = null;

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function maskEmail(email: string) {
  const [name = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  const visible = name.length <= 2 ? `${name[0] || '*'}*` : `${name.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}

function getSmtpConfig(): { config?: SmtpConfig; missing?: string[] } {
  const host = String(process.env.SMTP_HOST || '').trim();
  const rawPort = String(process.env.SMTP_PORT || '').trim();
  const secure = parseBoolean(process.env.SMTP_SECURE, true);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '');
  const from = String(process.env.EMAIL_FROM || '').trim();
  const replyTo = String(process.env.EMAIL_REPLY_TO || '').trim();

  const missing = [
    !host ? 'SMTP_HOST' : '',
    !rawPort ? 'SMTP_PORT' : '',
    !user ? 'SMTP_USER' : '',
    !pass ? 'SMTP_PASS' : '',
    !from ? 'EMAIL_FROM' : '',
  ].filter(Boolean);

  if (missing.length > 0) {
    return { missing };
  }

  const parsedPort = Number(rawPort);
  const port = Number.isFinite(parsedPort) ? parsedPort : secure ? 465 : 587;

  return {
    config: {
      host,
      port,
      secure,
      user,
      pass,
      from,
      replyTo: replyTo || undefined,
    },
  };
}

function getTransporter(config: SmtpConfig) {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  if (!verifyPromise) {
    verifyPromise = cachedTransporter.verify().then(() => {
      logApiEvent('/lib/email', 'smtp_verified', {
        host: config.host,
        port: config.port,
        secure: config.secure,
      });
    }).catch((error: unknown) => {
      verifyPromise = null;
      throw error;
    });
  }

  return { transporter: cachedTransporter, ready: verifyPromise };
}

export function isEmailConfigured() {
  const { config } = getSmtpConfig();
  return Boolean(config);
}

export async function sendTransactionalEmail(payload: MailPayload): Promise<EmailSendResult> {
  const { config, missing } = getSmtpConfig();

  if (!config) {
    logApiEvent('/lib/email', 'smtp_not_configured', {
      missing,
      to: maskEmail(payload.to),
      subject: payload.subject,
    });
    return { ok: true, skipped: true };
  }

  try {
    const { transporter, ready } = getTransporter(config);
    await ready;

    const info = await transporter.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    logApiEvent('/lib/email', 'email_sent', {
      to: maskEmail(payload.to),
      subject: payload.subject,
      messageId: info.messageId,
    });

    return { ok: true, skipped: false, messageId: info.messageId };
  } catch (error: unknown) {
    logApiError('/lib/email', error, {
      to: maskEmail(payload.to),
      subject: payload.subject,
    });
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : 'SMTP_ERROR',
    };
  }
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string; name?: string | null }) {
  const displayName = params.name?.trim() || 'cliente';
  const subject = 'Recupera tu contraseña de Punto IA';
  const text = [
    `Hola ${displayName},`,
    '',
    'Recibimos una solicitud para recuperar tu contraseña.',
    'Haz clic en el siguiente enlace (expira en 30 minutos):',
    params.resetUrl,
    '',
    'Si no hiciste esta solicitud, puedes ignorar este mensaje.',
  ].join('\n');

  const html = `<p>Hola <strong>${displayName}</strong>,</p>
<p>Recibimos una solicitud para recuperar tu contraseña.</p>
<p>Haz clic en este enlace (expira en 30 minutos):</p>
<p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
<p>Si no hiciste esta solicitud, puedes ignorar este mensaje.</p>`;

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}

export async function sendPasswordResetSuccessEmail(params: { to: string; name?: string | null }) {
  const displayName = params.name?.trim() || 'cliente';
  const subject = 'Tu contraseña de Punto IA fue actualizada';
  const text = [
    `Hola ${displayName},`,
    '',
    'Tu contraseña fue actualizada correctamente.',
    'Ya puedes iniciar sesión con tu nueva contraseña.',
    '',
    'Si no reconoces este cambio, contáctanos de inmediato en contacto@puntoia.mx.',
  ].join('\n');

  const html = `<p>Hola <strong>${displayName}</strong>,</p>
<p>Tu contraseña fue actualizada correctamente.</p>
<p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
<p>Si no reconoces este cambio, contáctanos de inmediato en <a href="mailto:contacto@puntoia.mx">contacto@puntoia.mx</a>.</p>`;

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}

export async function sendWelcomeEmail(params: { to: string; name?: string | null }) {
  const displayName = params.name?.trim() || 'cliente';
  const subject = 'Tu cuenta de Punto IA ya está lista';
  const text = [
    `Hola ${displayName},`,
    '',
    'Tu cuenta fue creada correctamente.',
    'Ya puedes iniciar sesión y empezar a acumular recompensas con Punto IA.',
    '',
    'Si estás en tienda, también puedes activar tu pase para comenzar de inmediato.',
  ].join('\n');

  const html = `<p>Hola <strong>${displayName}</strong>,</p>
<p>Tu cuenta fue creada correctamente.</p>
<p>Ya puedes iniciar sesión y empezar a acumular recompensas con Punto IA.</p>
<p>Si estás en tienda, también puedes activar tu pase para comenzar de inmediato.</p>`;

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}

export async function sendRedemptionRequestedEmail(params: {
  to: string;
  name?: string | null;
  businessName: string;
  code: string;
}) {
  const displayName = params.name?.trim() || 'cliente';
  const subject = 'Tu código de canje está listo';
  const text = [
    `Hola ${displayName},`,
    '',
    `Tu código de canje para ${params.businessName} es: ${params.code}`,
    'Muéstralo en caja para validar tu premio.',
  ].join('\n');

  const html = `<p>Hola <strong>${displayName}</strong>,</p>
<p>Tu código de canje para <strong>${params.businessName}</strong> es:</p>
<p style="font-size:20px;font-weight:700;letter-spacing:2px;">${params.code}</p>
<p>Muéstralo en caja para validar tu premio.</p>`;

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}

export async function sendRedemptionValidatedEmail(params: {
  to: string;
  name?: string | null;
  businessName: string;
  rewardName?: string | null;
}) {
  const displayName = params.name?.trim() || 'cliente';
  const rewardText = params.rewardName?.trim() ? `Premio aplicado: ${params.rewardName}.` : 'Tu premio fue aplicado correctamente.';
  const subject = 'Canje confirmado en Punto IA';
  const text = [
    `Hola ${displayName},`,
    '',
    `Tu canje en ${params.businessName} fue validado.`,
    rewardText,
    '',
    'Gracias por seguir acumulando con Punto IA.',
  ].join('\n');

  const html = `<p>Hola <strong>${displayName}</strong>,</p>
<p>Tu canje en <strong>${params.businessName}</strong> fue validado.</p>
<p>${rewardText}</p>
<p>Gracias por seguir acumulando con Punto IA.</p>`;

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}
