-- Enums for challenge system
DO $$ BEGIN
  CREATE TYPE "ChallengeType" AS ENUM ('VISIT_COUNT', 'DISTINCT_BUSINESSES');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChallengeProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "coalition_rewards" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reward_type" TEXT NOT NULL,
  "reward_value" TEXT NOT NULL,
  "redemption_limit" INTEGER NOT NULL DEFAULT 1,
  "expires_at" TIMESTAMPTZ,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "coalition_rewards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "coalition_rewards_business_id_idx" ON "coalition_rewards"("business_id");

CREATE TABLE IF NOT EXISTS "challenges" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "challenge_type" "ChallengeType" NOT NULL,
  "target_value" INTEGER NOT NULL,
  "time_window" INTEGER NOT NULL,
  "reward_campaign_id" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "challenges_active_idx" ON "challenges"("active");

CREATE TABLE IF NOT EXISTS "customer_challenge_progress" (
  "customer_id" TEXT NOT NULL,
  "challenge_id" TEXT NOT NULL,
  "progress_value" INTEGER NOT NULL DEFAULT 0,
  "status" "ChallengeProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "completed_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "customer_challenge_progress_pkey" PRIMARY KEY ("customer_id", "challenge_id")
);

CREATE INDEX IF NOT EXISTS "customer_challenge_progress_status_idx" ON "customer_challenge_progress"("status");

CREATE TABLE IF NOT EXISTS "customer_coalition_rewards" (
  "id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "reward_id" TEXT NOT NULL,
  "unlocked_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "redeemed_at" TIMESTAMPTZ,
  CONSTRAINT "customer_coalition_rewards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_coalition_rewards_customer_id_reward_id_key" ON "customer_coalition_rewards"("customer_id", "reward_id");
CREATE INDEX IF NOT EXISTS "customer_coalition_rewards_customer_id_idx" ON "customer_coalition_rewards"("customer_id");

DO $$ BEGIN
  ALTER TABLE "coalition_rewards" ADD CONSTRAINT "coalition_rewards_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "challenges" ADD CONSTRAINT "challenges_reward_campaign_id_fkey"
    FOREIGN KEY ("reward_campaign_id") REFERENCES "coalition_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_challenge_progress" ADD CONSTRAINT "customer_challenge_progress_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_challenge_progress" ADD CONSTRAINT "customer_challenge_progress_challenge_id_fkey"
    FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_coalition_rewards" ADD CONSTRAINT "customer_coalition_rewards_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_coalition_rewards" ADD CONSTRAINT "customer_coalition_rewards_reward_id_fkey"
    FOREIGN KEY ("reward_id") REFERENCES "coalition_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
