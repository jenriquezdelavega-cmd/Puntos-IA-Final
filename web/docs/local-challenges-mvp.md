# Local Challenges MVP (Retos Locales)

Este MVP deja una base operativa para demo comercial con 3 retos fijos y recompensas simples.

## Endpoint de siembra para demo

`POST /api/admin/seed-local-challenges`

Body mínimo:

```json
{
  "masterUsername": "admin",
  "masterPassword": "superadmin2026"
}
```

Body opcional con negocios concretos:

```json
{
  "masterUsername": "admin",
  "masterPassword": "superadmin2026",
  "tenantIds": ["tenant-id-1", "tenant-id-2", "tenant-id-3"]
}
```

## Qué crea/actualiza

## Requisito de adhesión de negocio

Para participar en este modelo de coalición, el negocio debe estar adherido desde Admin con:

- `coalitionOptIn = true`
- `coalitionDiscountPercent >= 10`
- `coalitionProduct` capturado (producto participante)

Solo esos negocios aparecen en el filtro de coalición para Master y son elegibles para la siembra de retos/recompensas del MVP.

- 3 recompensas de coalición activas (expiran en 45 días)
- 3 retos activos:
  - Café de la semana (1 visita en 7 días)
  - Corte del mes (1 visita en 30 días)
  - Explorador local (2 negocios distintos en 30 días)

> Se usa `upsert` para que sea idempotente y se pueda ejecutar varias veces sin duplicar.

## Flujo de demo recomendado

1. Ejecutar endpoint de siembra.
2. Registrar visita desde `/api/check-in/scan`.
3. Abrir Hub cliente y revisar tab **Retos**.
4. Validar beneficios desbloqueados en `/api/user/coalition-rewards`.


## Ciclo de canje de coalición

1. Cliente desbloquea beneficio.
2. Cliente solicita código (`/api/redeem/coalition/request`) y queda en estado **solicitado**.
3. Staff valida en caja con el flujo existente (`/api/redeem/validate`) y queda en estado **canjeado**.

