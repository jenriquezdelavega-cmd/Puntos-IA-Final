# Security runbook (Fase 1)

Runbook operativo mínimo para rotación de secretos y respuesta básica a incidentes.

## Secretos críticos

- `MASTER_PASSWORD`
- `DATABASE_URL`
- `APPLE_PASS_TYPE_ID`
- Secrets Apple Wallet (`APPLE_WWDR_PEM`, `APPLE_SIGNER_CERT_PEM`, `APPLE_SIGNER_KEY_PEM`)
- Secrets Google Wallet (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_WALLET_ISSUER_ID`)

## Rotación de secretos

### MASTER_PASSWORD

1. Generar nuevo valor fuerte (>=24 chars aleatorios).
2. Actualizar variable de entorno en el entorno objetivo.
3. Re-desplegar/reiniciar servicio.
4. Verificar rutas `/api/master/*` con nuevo valor.
5. Revocar acceso al valor anterior.

### Credenciales Wallet

1. Generar nuevas credenciales/certificados en proveedor.
2. Actualizar variables de entorno correspondientes.
3. Re-desplegar servicio.
4. Validar emisión/actualización de pass.
5. Revocar credenciales previas.

### DATABASE_URL

1. Rotar credenciales de base de datos.
2. Actualizar `DATABASE_URL`.
3. Re-desplegar servicio.
4. Validar conectividad Prisma y rutas de lectura.

## Incidentes (básico)

### Detección

- Picos de `401/403/429`.
- Picos de `500` en rutas críticas.
- Actividad anómala en `master/*` o `admin/*`.

### Contención

1. Rotar `MASTER_PASSWORD`.
2. Rotar secretos de wallet si aplica.
3. Bloquear temporalmente rutas afectadas.
4. Preservar evidencia (`requestId`, actor, tenant, timestamps).

### Recuperación

1. Corregir causa raíz.
2. Desplegar fix.
3. Verificar rutas críticas (`master`, `admin`, `user` mutaciones, `redeem`, `check-in/scan`).
4. Monitorear métricas 24h.

## Checklist de despliegue seguro

- [ ] Secrets por ambiente configurados.
- [ ] Validaciones CI en verde.
- [ ] Verificación manual de login/roles.
- [ ] `x-request-id` presente en rutas API críticas.
