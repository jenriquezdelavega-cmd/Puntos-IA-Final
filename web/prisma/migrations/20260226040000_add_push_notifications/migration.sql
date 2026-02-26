-- CreateTable
CREATE TABLE IF NOT EXISTS "tenant_push_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "devices" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "tenant_push_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_push_logs_tenantId_fkey'
    ) THEN
        ALTER TABLE "tenant_push_logs"
        ADD CONSTRAINT "tenant_push_logs_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddColumn to tenant_wallet_styles
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_wallet_styles' AND column_name = 'last_push_message'
    ) THEN
        ALTER TABLE "tenant_wallet_styles" ADD COLUMN "last_push_message" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;
