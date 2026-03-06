ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "coalition_opt_in" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "coalition_discount_percent" INTEGER NOT NULL DEFAULT 0;

UPDATE "Tenant"
SET "coalition_discount_percent" = 10
WHERE "coalition_opt_in" = true AND "coalition_discount_percent" < 10;
