ALTER TABLE "customer_coalition_rewards"
  ADD COLUMN IF NOT EXISTS "requested_at" TIMESTAMPTZ;

ALTER TABLE "Redemption"
  ADD COLUMN IF NOT EXISTS "coalition_reward_unlock_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Redemption_coalition_reward_unlock_id_key"
  ON "Redemption"("coalition_reward_unlock_id");

DO $$ BEGIN
  ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_coalition_reward_unlock_id_fkey"
    FOREIGN KEY ("coalition_reward_unlock_id") REFERENCES "customer_coalition_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
