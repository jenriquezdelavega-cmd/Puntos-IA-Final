ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "period_expiry_push_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "period_expiry_push_days_before" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "period_expiry_last_notified_period_key" TEXT,
  ADD COLUMN IF NOT EXISTS "period_expiry_last_notified_at" TIMESTAMP(3);
