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

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

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
  const secure = parseBoolean(
    readEnv('SMTP_SECURE', 'MAIL_SECURE', 'EMAIL_SMTP_SECURE'),
    true,
  );
  const host = readEnv('SMTP_HOST', 'MAIL_HOST', 'EMAIL_SMTP_HOST') || 'smtpout.secureserver.net';
  const rawPort = readEnv('SMTP_PORT', 'MAIL_PORT', 'EMAIL_SMTP_PORT');
  const user = readEnv(
    'SMTP_USER',
    'SMTP_USERNAME',
    'MAIL_USER',
    'MAIL_USERNAME',
    'EMAIL_SMTP_USER',
  );
  const pass = readEnv(
    'SMTP_PASS',
    'SMTP_PASSWORD',
    'MAIL_PASS',
    'MAIL_PASSWORD',
    'EMAIL_SMTP_PASS',
  );
  const from = readEnv('EMAIL_FROM', 'SMTP_FROM', 'MAIL_FROM')
    || (user ? `Punto IA <${user}>` : '');
  const replyTo = readEnv('EMAIL_REPLY_TO', 'SMTP_REPLY_TO', 'MAIL_REPLY_TO');

  const missing = [
    !user ? 'SMTP_USER' : '',
    !pass ? 'SMTP_PASS' : '',
    !from ? 'EMAIL_FROM' : '',
  ].filter(Boolean);

  if (missing.length > 0) {
    return { missing };
  }

  const parsedPort = Number(rawPort);
  const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : secure ? 465 : 587;

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
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPublicBaseUrl() {
  return String(process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/$/, '');
}

function renderBrandedEmailTemplate(input: {
  preheader: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  helperText?: string;
}) {
  const brandUrl = getPublicBaseUrl();
  const logoUrl = `${brandUrl || 'https://puntoia.mx'}/logo.png`;
  const title = escapeHtml(input.title);
  const greeting = escapeHtml(input.greeting);
  const preheader = escapeHtml(input.preheader);
  const paragraphs = input.paragraphs.map((line) => `<p style="margin:0 0 14px;color:#4c3a74;line-height:1.6;font-size:15px;">${escapeHtml(line)}</p>`).join('');
  const helperText = input.helperText ? `<p style="margin:16px 0 0;color:#7a68a3;line-height:1.5;font-size:13px;">${escapeHtml(input.helperText)}</p>` : '';
  const cta = input.ctaLabel && input.ctaUrl
    ? `<a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:linear-gradient(90deg,#ff8560 0%,#ff5e91 52%,#8a60f6 100%);color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;font-size:14px;">${escapeHtml(input.ctaLabel)}</a>`
    : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#fffaf4;font-family:Inter,Arial,Helvetica,sans-serif;color:#26184b;">
    <div style="display:none;visibility:hidden;opacity:0;height:0;overflow:hidden;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf4;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #eadcf8;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:18px 24px;background:linear-gradient(120deg,#241548 0%,#3a236d 58%,#5a33a4 100%);border-bottom:1px solid #eadcf8;">
                ${
                  logoUrl
                    ? `<span style="display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.24);">
                         <img src="${escapeHtml(logoUrl)}" alt="Punto IA" style="height:28px;width:auto;display:block;" />
                       </span>`
                    : '<p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">Punto IA</p>'
                }
              </td>
            </tr>
            <tr>
              <td style="padding:26px 24px 22px;">
                <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;color:#26184b;">${title}</h1>
                <p style="margin:0 0 16px;color:#3f2f66;line-height:1.6;font-size:15px;">${greeting}</p>
                ${paragraphs}
                ${cta ? `<div style="margin:20px 0 10px;">${cta}</div>` : ''}
                ${helperText}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #f0e6fd;background:#fffcf8;">
                <p style="margin:0;color:#7a68a3;font-size:12px;line-height:1.5;">Punto IA · Lealtad digital para PyMEs en México</p>
                <p style="margin:6px 0 0;color:#7a68a3;font-size:12px;line-height:1.5;">¿Necesitas ayuda? Escríbenos a <a href="mailto:contacto@puntoia.mx" style="color:#6e4ab0;">contacto@puntoia.mx</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
      sender: config.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      headers: {
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
      },
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

  const html = renderBrandedEmailTemplate({
    preheader: 'Solicitud para recuperar contraseña',
    title: 'Recupera tu contraseña',
    greeting: `Hola ${displayName},`,
    paragraphs: [
      'Recibimos una solicitud para recuperar tu contraseña.',
      'Por seguridad, este enlace expira en 30 minutos.',
    ],
    ctaLabel: 'Restablecer contraseña',
    ctaUrl: params.resetUrl,
    helperText: 'Si tú no hiciste esta solicitud, puedes ignorar este mensaje.',
  });

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

  const html = renderBrandedEmailTemplate({
    preheader: 'Confirmación de cambio de contraseña',
    title: 'Contraseña actualizada',
    greeting: `Hola ${displayName},`,
    paragraphs: [
      'Tu contraseña fue actualizada correctamente.',
      'Ya puedes iniciar sesión con tu nueva contraseña.',
    ],
    ctaLabel: 'Iniciar sesión',
    ctaUrl: `${getPublicBaseUrl() || 'https://puntoia.mx'}/ingresar?tipo=cliente&modo=login`,
    helperText: 'Si no reconoces este cambio, contáctanos de inmediato en contacto@puntoia.mx.',
  });

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}

export async function sendTenantAccountCreatedEmail(params: {
  to: string;
  name?: string | null;
  businessName: string;
  username: string;
  temporaryPassword: string;
  loginUrl: string;
}) {
  const displayName = params.name?.trim() || 'equipo';
  const subject = `Tu cuenta operativa de ${params.businessName} está lista`;
  const text = [
    `Hola ${displayName},`,
    '',
    `Se creó tu cuenta operativa en ${params.businessName}.`,
    `Usuario: ${params.username}`,
    `Contraseña temporal: ${params.temporaryPassword}`,
    '',
    'Por seguridad debes cambiar tu contraseña en tu primer inicio de sesión.',
    `Ingresa aquí: ${params.loginUrl}`,
  ].join('\n');

  const html = renderBrandedEmailTemplate({
    preheader: 'Tu cuenta operativa fue creada',
    title: 'Cuenta operativa creada',
    greeting: `Hola ${displayName},`,
    paragraphs: [
      `Se creó tu cuenta operativa en ${params.businessName}.`,
      `Usuario: ${params.username}`,
      `Contraseña temporal: ${params.temporaryPassword}`,
      'Por seguridad debes cambiar tu contraseña en tu primer inicio de sesión.',
    ],
    ctaLabel: 'Iniciar sesión',
    ctaUrl: params.loginUrl,
    helperText: 'No compartas esta contraseña temporal. Cámbiala apenas ingreses.',
  });

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

  const html = renderBrandedEmailTemplate({
    preheader: 'Tu cuenta en Punto IA está lista',
    title: 'Bienvenido a Punto IA',
    greeting: `Hola ${displayName},`,
    paragraphs: [
      'Tu cuenta fue creada correctamente.',
      'Ya puedes iniciar sesión y empezar a acumular recompensas con Punto IA.',
      'Si estás en tienda, también puedes activar tu pase para comenzar de inmediato.',
    ],
    ctaLabel: 'Entrar a mi cuenta',
    ctaUrl: `${getPublicBaseUrl() || 'https://puntoia.mx'}/ingresar?tipo=cliente&modo=login`,
  });

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}

export async function sendEmailVerificationEmail(params: { to: string; name?: string | null; verifyUrl: string }) {
  const displayName = params.name?.trim() || 'cliente';
  const subject = 'Confirma tu correo para activar tu cuenta en Punto IA';
  const text = [
    `Hola ${displayName},`,
    '',
    'Gracias por crear tu cuenta en Punto IA.',
    'Para activarla, confirma tu correo haciendo clic en este enlace:',
    params.verifyUrl,
    '',
    'Este enlace expira en 24 horas.',
  ].join('\n');

  const html = renderBrandedEmailTemplate({
    preheader: 'Confirma tu correo y activa tu cuenta',
    title: 'Confirma tu correo',
    greeting: `Hola ${displayName},`,
    paragraphs: [
      'Gracias por crear tu cuenta en Punto IA.',
      'Para activar tu cuenta, confirma tu correo con el botón de abajo.',
      'Este enlace expira en 24 horas.',
    ],
    ctaLabel: 'Confirmar mi correo',
    ctaUrl: params.verifyUrl,
    helperText: 'Si no creaste esta cuenta, puedes ignorar este mensaje.',
  });

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

  const html = renderBrandedEmailTemplate({
    preheader: 'Tu código de canje está listo',
    title: 'Código de canje generado',
    greeting: `Hola ${displayName},`,
    paragraphs: [
      `Tu código de canje para ${params.businessName} es: ${params.code}`,
      'Muéstralo en caja para validar tu premio.',
    ],
    ctaLabel: 'Ver mi cuenta',
    ctaUrl: `${getPublicBaseUrl() || 'https://puntoia.mx'}/clientes/app`,
    helperText: 'Comparte el código solo en caja al momento del canje.',
  });

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

  const html = renderBrandedEmailTemplate({
    preheader: 'Confirmación de canje validado',
    title: 'Canje confirmado',
    greeting: `Hola ${displayName},`,
    paragraphs: [
      `Tu canje en ${params.businessName} fue validado.`,
      rewardText,
      'Gracias por seguir acumulando con Punto IA.',
    ],
    ctaLabel: 'Revisar mi progreso',
    ctaUrl: `${getPublicBaseUrl() || 'https://puntoia.mx'}/clientes/app`,
  });

  return sendTransactionalEmail({ to: params.to, subject, text, html });
}
