-- Harden redemption traceability and prevent duplicate pending redemptions for the main reward flow.
ALTER TABLE "Redemption"
  ADD COLUMN IF NOT EXISTS "earned_visit_id" TEXT,
  ADD COLUMN IF NOT EXISTS "redemption_email_sent_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "redeemed_by_tenant_user_id" TEXT;

ALTER TABLE "Redemption"
  ADD CONSTRAINT "Redemption_earned_visit_id_fkey"
    FOREIGN KEY ("earned_visit_id") REFERENCES "Visit"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Redemption"
  ADD CONSTRAINT "Redemption_redeemed_by_tenant_user_id_fkey"
    FOREIGN KEY ("redeemed_by_tenant_user_id") REFERENCES "TenantUser"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Redemption_tenantId_userId_isUsed_loyalty_milestone_id_coalition_reward_unlock_id_idx"
  ON "Redemption" ("tenantId", "userId", "isUsed", "loyalty_milestone_id", "coalition_reward_unlock_id");

CREATE INDEX IF NOT EXISTS "Redemption_earned_visit_id_idx"
  ON "Redemption" ("earned_visit_id");

CREATE INDEX IF NOT EXISTS "Redemption_redeemed_by_tenant_user_id_idx"
  ON "Redemption" ("redeemed_by_tenant_user_id");

WITH ranked_pending AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId", "userId"
      ORDER BY "createdAt" DESC, id DESC
    ) AS row_num
  FROM "Redemption"
  WHERE "isUsed" = FALSE
    AND "loyalty_milestone_id" IS NULL
    AND "coalition_reward_unlock_id" IS NULL
)
DELETE FROM "Redemption"
WHERE id IN (
  SELECT id
  FROM ranked_pending
  WHERE row_num > 1
);

-- Guarantee one pending code at most for the main reward per customer/business.
CREATE UNIQUE INDEX IF NOT EXISTS "Redemption_one_pending_main_reward_idx"
  ON "Redemption" ("tenantId", "userId")
  WHERE "isUsed" = FALSE
    AND "loyalty_milestone_id" IS NULL
    AND "coalition_reward_unlock_id" IS NULL;
