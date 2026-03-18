-- Add loyalty_milestone_id to redemptions table
ALTER TABLE "Redemption" ADD COLUMN "loyalty_milestone_id" TEXT;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_loyalty_milestone_id_fkey"
  FOREIGN KEY ("loyalty_milestone_id") REFERENCES "loyalty_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
