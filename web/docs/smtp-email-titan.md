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
- `PUBLIC_BASE_URL` (requerida para links de recuperación de contraseña)

Ejemplo:

- `SMTP_HOST=smtpout.secureserver.net`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=contacto@puntoia.mx`
- `SMTP_PASS=***`
- `EMAIL_FROM="Punto IA <contacto@puntoia.mx>"`
- `EMAIL_REPLY_TO="contacto@puntoia.mx"`
- `PUBLIC_BASE_URL=http://localhost:3000`

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
