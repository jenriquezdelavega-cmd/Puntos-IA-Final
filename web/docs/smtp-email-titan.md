# SMTP transaccional (GoDaddy Titan) - Punto IA

Esta implementación usa `Nodemailer` con SMTP directo y funciones reutilizables en `app/lib/email.ts`.

## Variables de entorno requeridas

Configura estas variables en `web/.env` (o en el provider de despliegue):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `PUBLIC_BASE_URL` (recomendada en producción para links de recuperación)
- `NEXT_PUBLIC_APP_URL` (fallback para links en correos)

Ejemplo:

- `SMTP_HOST=smtpout.secureserver.net`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=contacto@puntoia.mx`
- `SMTP_PASS=***`
- `EMAIL_FROM="Punto IA <contacto@puntoia.mx>"`
- `EMAIL_REPLY_TO="contacto@puntoia.mx"`
- `PUBLIC_BASE_URL=http://localhost:3000`

### Nota para Vercel

- En Vercel define los valores como texto plano en *Project Settings → Environment Variables*.
- No necesitas comillas en Vercel para `SMTP_PASS` aunque tenga símbolos especiales.
- Asegura `PUBLIC_BASE_URL=https://puntoia.mx` en producción para que los links del correo apunten al dominio correcto.
- Si no defines `PUBLIC_BASE_URL`, el sistema usa automáticamente el `origin` del request para construir el link de recuperación.
- El servicio ahora acepta aliases comunes: `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.
- Si no envías `SMTP_HOST`/`SMTP_PORT`, usa defaults Titan (`smtpout.secureserver.net:465`).
- Si no envías `EMAIL_FROM`, usa fallback automático: `Punto IA <SMTP_USER>`.

### Diagnóstico rápido (si no llegan correos)

- Revisa logs de `POST /api/user/password/forgot` y `POST /api/user/register`.
- Si aparece `event: "smtp_not_configured"`, faltan variables SMTP en el entorno desplegado.
- Si `responseStatusCode` es `200` pero el evento de email es `smtp_not_configured`, el flujo principal funciona pero **no se envía ningún correo** hasta completar variables SMTP.

## Flujos conectados

1. **Recuperar contraseña**  
   - Endpoint: `POST /api/user/password/forgot`  
   - Envia link de reset por email.

2. **Confirmación de cambio de contraseña**  
   - Endpoint: `POST /api/user/password/reset`  
   - Envia confirmación después de actualizar contraseña.

3. **Confirmación de creación de cuenta**  
   - Endpoint: `POST /api/user/register`  
   - Envia bienvenida si el usuario registró email.

4. **Confirmación de solicitud de redención**  
   - Endpoint: `POST /api/redeem/request`  
   - Envia código de canje al cliente (si tiene email).

5. **Confirmación de redención validada**  
   - Endpoint: `POST /api/redeem/validate`  
   - Envia confirmación cuando el negocio valida el canje.

## Logs y manejo de errores

- Se registran eventos y errores en `logApiEvent` / `logApiError`.
- Si SMTP no está configurado, el sistema **no rompe el flujo principal** y marca envío como `skipped`.
- Si falla SMTP, el endpoint principal continúa y queda logueado el error de email.
- El transporte SMTP usa timeouts de conexión para evitar requests colgados.

## Pruebas locales recomendadas

1. Levanta app:
   - `cd web && npm run dev`

2. Probar flujo de recuperación:
   - `POST /api/user/password/forgot` con un email existente.
   - Confirma recepción del correo con el link.

3. Probar registro:
   - `POST /api/user/register` incluyendo `email`.
   - Confirma correo de bienvenida.

4. Probar redención:
   - Solicita código con `POST /api/redeem/request`.
   - Valida código con `POST /api/redeem/validate`.
   - Confirma correos de solicitud y confirmación.
