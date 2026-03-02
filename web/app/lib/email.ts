export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }): Promise<void> {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.EMAIL_FROM || '').trim();

  if (!apiKey || !from) {
    console.info('[password-reset] Email provider no configurado. Link de recuperación:', params.resetUrl);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: 'Recupera tu contraseña de Punto IA',
      html: `<p>Recibimos una solicitud para recuperar tu contraseña.</p>
<p>Haz clic aquí para continuar (expira en 30 minutos):</p>
<p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
<p>Si tú no hiciste esta solicitud, ignora este mensaje.</p>`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`No se pudo enviar email (${response.status}): ${text}`);
  }
}
