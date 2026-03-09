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

### Si Outlook/Hotmail lo manda a "No deseado"

Esto casi siempre es tema de reputación/autenticación de dominio (no del endpoint).

Checklist recomendado:

1. **SPF** de `puntoia.mx` debe incluir el proveedor SMTP (Titan/GoDaddy).
2. **DKIM** habilitado y validado desde Titan para `contacto@puntoia.mx`.
3. **DMARC** publicado (`_dmarc.puntoia.mx`) con política inicial `p=none`, luego subir a `quarantine/reject`.
4. Usar siempre `FROM` del mismo dominio autenticado (`@puntoia.mx`), evitar remitentes de dominios distintos.
5. Evitar picos de envío bruscos (calentar dominio de forma gradual).

Nota: En código ya se añadieron headers transaccionales y mejor contraste de branding en header de email.

### Logo en cabecera vs icono del remitente

- **Cabecera HTML del correo**: se controla desde `app/lib/email.ts` (logo grande + apoyo visual).
- **Icono circular del remitente** (el que a veces sale como letra "C" en Gmail/Outlook): **no lo controla el HTML del correo**.
- Ese icono depende de autenticación/reputación de dominio y proveedor (principalmente **BIMI + DKIM + SPF + DMARC**).
- Si quieres que ahí aparezca tu marca, hay que configurar BIMI del dominio (normalmente requiere SVG Tiny PS y, en muchos casos, VMC/CMC).

### Setup recomendado de avatar (BIMI) para Punto IA

Con el asset `web/public/puntoia.svg`, usa esta URL pública:

- `https://puntoia.mx/puntoia.svg`

Registro DNS sugerido:

- Host: `default._bimi.puntoia.mx`
- Tipo: `TXT`
- Valor: `v=BIMI1; l=https://puntoia.mx/puntoia.svg;`

Checklist mínimo para que tenga efecto:

1. DKIM activo y alineado para `puntoia.mx`.
2. SPF activo (ya está).
3. DMARC en enforcement (`p=quarantine` o `p=reject`, ya tienes `quarantine`).
4. Esperar propagación DNS y recalificación del proveedor (puede tardar).

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
