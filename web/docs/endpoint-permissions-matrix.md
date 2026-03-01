# Endpoint permissions matrix (Fase 1)

Esta matriz documenta el rol/credencial esperada por endpoint para cerrar el entregable de Fase 1 de seguridad y contratos.

## Roles / credenciales

- `MASTER_PASSWORD`: operaciones de super-admin global.
- `TENANT_ADMIN_SESSION`: sesión de usuario de negocio con rol `ADMIN`.
- `TENANT_STAFF_SESSION`: sesión de usuario de negocio con rol `STAFF` (o superior según endpoint).
- `USER_SESSION`: sesión firmada de cliente final (`sessionToken`).
- `PUBLIC`: endpoint sin autenticación (catálogo, onboarding, debug operativo, etc.).

## Master

| Endpoint | Método | Acceso |
|---|---|---|
| `/api/master/list-tenants` | POST | `MASTER_PASSWORD` |
| `/api/master/create-tenant` | POST | `MASTER_PASSWORD` |
| `/api/master/create-user` | POST | `MASTER_PASSWORD` |
| `/api/master/manage-tenant` | POST | `MASTER_PASSWORD` |
| `/api/master/manage-user` | POST | `MASTER_PASSWORD` |
| `/api/master/migrate-prefixes` | POST | `MASTER_PASSWORD` |
| `/api/master/reports` | POST | `MASTER_PASSWORD` |

## Admin/Tenant (panel negocio)

| Endpoint | Método | Acceso |
|---|---|---|
| `/api/admin/stats` | POST | `TENANT_ADMIN_SESSION` |
| `/api/admin/reports` | POST | `TENANT_ADMIN_SESSION` |
| `/api/admin/generate` | POST | `TENANT_ADMIN_SESSION` o `TENANT_STAFF_SESSION` |
| `/api/admin/push` | GET/POST | `TENANT_ADMIN_SESSION` |
| `/api/tenant/settings` | POST | `TENANT_ADMIN_SESSION` |
| `/api/tenant/users` | GET/POST/DELETE | `TENANT_ADMIN_SESSION` |
| `/api/check-in/scan` | POST | `TENANT_ADMIN_SESSION` o `TENANT_STAFF_SESSION` |
| `/api/redeem/validate` | POST | `TENANT_ADMIN_SESSION` o `TENANT_STAFF_SESSION` |

## Usuario final (cliente)

| Endpoint | Método | Acceso |
|---|---|---|
| `/api/user/profile` | POST | `PUBLIC` (login/lookup) |
| `/api/user/login` | POST | `PUBLIC` (login) |
| `/api/user/register` | POST | `PUBLIC` (registro) |
| `/api/user/history` | POST | `USER_SESSION` |
| `/api/user/update` | POST | `USER_SESSION` |
| `/api/redeem/request` | POST | `USER_SESSION` |

## Wallet / Pass / públicos

| Endpoint | Método | Acceso |
|---|---|---|
| `/api/wallet/google` | GET | `PUBLIC` (requiere ids válidos) |
| `/api/wallet/google/class` | GET | `PUBLIC` (operación técnica, envs requeridas) |
| `/api/wallet/apple` | GET | `PUBLIC` (requiere ids válidos) |
| `/api/wallet/apple/v1/...` | GET/POST/DELETE | Protocolo Apple Pass + auth token ApplePass |
| `/api/pass/create` | POST | `PUBLIC` |
| `/api/pass/[customer_id]` | GET | `PUBLIC` |
| `/api/pass/resolve-token` | POST | `PUBLIC` |
| `/api/map/tenants` | GET | `PUBLIC` |
| `/api/prelaunch/business` | POST | `PUBLIC` |
| `/api/debug` | GET | `PUBLIC` |

## Legacy deshabilitados

| Endpoint | Método | Estado |
|---|---|---|
| `/api/check-in` | POST | `410` (usar `/api/check-in/scan`) |
| `/api/redeem` | POST | `410` (usar `/api/redeem/request` + `/api/redeem/validate`) |

## Notas

- Todos los endpoints migrados al contrato común retornan `requestId` y header `x-request-id`.
- En endpoints multi-tenant, validar siempre alcance (`tenantId`) contra la sesión del actor.
- Esta matriz debe evolucionar junto con cambios de rutas/roles.
