-- CreateTable
CREATE TABLE "loyalty_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "visit_target" INTEGER NOT NULL,
    "reward" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎁',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loyalty_milestones_tenant_id_idx" ON "loyalty_milestones"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_milestones_tenant_id_visit_target_key" ON "loyalty_milestones"("tenant_id", "visit_target");

-- AddForeignKey
ALTER TABLE "loyalty_milestones" ADD CONSTRAINT "loyalty_milestones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
