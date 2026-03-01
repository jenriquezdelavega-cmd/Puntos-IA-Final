# Revisión técnica inicial y plan de trabajo (Punto IA)

## 1) Diagnóstico ejecutivo

Después de una revisión estática del código en `web/`, el producto ya tiene una base funcional clara (Next.js + Prisma + rutas API separadas por dominio), pero hay **riesgos altos de seguridad y mantenibilidad** que conviene atacar antes de escalar:

- **Autenticación/autorización incompleta en varias rutas críticas** (se puede consultar o modificar datos sensibles sin sesión/token).
- **Superficie de ataque elevada por uso de contraseña maestra compartida** y con fallback por defecto.
- **Validación de entrada inconsistente** (falta esquema unificado tipo Zod/Valibot).
- **Observabilidad y calidad automática insuficientes** (sin señal clara de tests ni lint ejecutable en este entorno sin instalar dependencias).

## 2) Hallazgos prioritarios (riesgo alto)

1. **Endpoints administrativos sin verificación de identidad/rol robusta**.
   - Ejemplo: `POST /api/admin/stats` opera solo con `tenantId` del body.
   - Ejemplo: `POST /api/admin/reports` expone reportes y CSV por `tenantId`.

2. **Actualización de perfil de usuario sin sesión explícita**.
   - `POST /api/user/update` permite actualizar usuario usando solo `id` enviado en payload.

3. **Modelo de “master password” frágil**.
   - Existe fallback hardcodeado (`superadmin2026`) cuando no está seteada la variable de entorno.
   - A mediano plazo debería reemplazarse por identidad fuerte (JWT con claims + roles, o proveedor externo).

## 3) Plan de trabajo recomendado (como siguiente iteración)

### Fase 0 — Contención rápida (1–2 días)

- Eliminar cualquier fallback inseguro de secretos críticos (`MASTER_PASSWORD`) y fallar en arranque si falta configuración.
- Proteger inmediatamente rutas `admin/*`, `master/*` y mutaciones de `user/*` con middleware/guard centralizado.
- Restringir operaciones por `tenantId` validando siempre que el usuario autenticado pertenece a ese tenant y tiene rol suficiente.
- Agregar rate limiting mínimo para login, canje y rutas administrativas.

### Fase 1 — Capa de seguridad y contratos (3–5 días)

- Implementar autenticación basada en sesión/JWT firmada y expiración corta.
- Definir RBAC por roles (`MASTER`, `TENANT_ADMIN`, `STAFF`, `CUSTOMER`) y aplicarlo por handler.
- Incorporar validación de payloads con esquemas compartidos (entrada/salida) para todas las rutas API.
- Estandarizar errores API (`code`, `message`, `details`, `requestId`).

### Fase 2 — Calidad y deuda técnica (3–5 días)

- Activar pipeline mínimo de calidad:
  - `eslint`
  - `tsc --noEmit`
  - tests unitarios de utilidades críticas (auth/password/validación)
  - tests de integración de rutas sensibles
- Definir criterio de merge: sin errores de lint/type-check/tests en PR.
- Crear fixtures de datos para QA y pruebas reproducibles.

### Fase 3 — Observabilidad y operación (2–4 días)

- Logging estructurado en API (requestId, actorId, tenantId, acción, latencia).
- Auditoría para acciones sensibles (crear tenant, editar usuarios, canjes).
- Métricas básicas (errores 5xx, p95 de latencia, tasa de login fallido, tasa de canje).

### Fase 4 — Producto y escalabilidad (continuo)

- Revisar performance de consultas de reportes y agregar índices Prisma/DB donde haga falta.
- Evaluar paginación/filtrado server-side para endpoints con crecimiento de datos.
- Hardening gradual de UX de autenticación (bloqueos temporales, recuperación de contraseña, rotación de sesiones).

## 4) Backlog priorizado (orden de ejecución sugerido)

1. Guard central de auth + autorización por rol (bloqueante).
2. Cierre de endpoints sin auth (`admin`, `user/update`, etc.).
3. Remover fallback de master password + política de secretos.
4. Validación unificada de inputs y respuestas.
5. Test suite mínima en rutas críticas.
6. Auditoría y métricas operativas.

## 5) Entregables de la siguiente sprint

- [x] Middleware/guard reusable para App Router API.
- [x] Matriz de permisos por endpoint.
- [x] 100% de rutas críticas con validación de esquema.
- [x] CI con lint + type-check + tests.
- [x] Documento de runbook de seguridad (rotación de secretos + incident response básico).

## 6) Criterios de éxito

- Ningún endpoint crítico acepta operaciones sin actor autenticado.
- Ningún actor puede operar fuera de su tenant.
- Fallos de validación devuelven errores consistentes y trazables.
- Cada PR relevante pasa validaciones automáticas antes de merge.
