WITH ranked_admins AS (
  SELECT
    "id",
    "tenantId",
    ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "id" ASC) AS admin_rank
  FROM "TenantUser"
  WHERE UPPER(COALESCE("role", '')) = 'ADMIN'
)
UPDATE "TenantUser" tu
SET "role" = 'STAFF'
FROM ranked_admins ra
WHERE tu."id" = ra."id"
  AND ra.admin_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_user_single_admin_per_tenant_idx"
ON "TenantUser" ("tenantId")
WHERE UPPER(COALESCE("role", '')) = 'ADMIN';
