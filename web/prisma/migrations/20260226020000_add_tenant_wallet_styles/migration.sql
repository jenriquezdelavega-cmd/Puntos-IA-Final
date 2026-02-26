-- CreateTable (safe: IF NOT EXISTS preserves existing data)
CREATE TABLE IF NOT EXISTS "tenant_wallet_styles" (
    "tenant_id" TEXT NOT NULL,
    "background_color" TEXT NOT NULL DEFAULT 'rgb(31,41,55)',
    "foreground_color" TEXT NOT NULL DEFAULT 'rgb(255,255,255)',
    "label_color" TEXT NOT NULL DEFAULT 'rgb(191,219,254)',
    "strip_image_data" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "tenant_wallet_styles_pkey" PRIMARY KEY ("tenant_id")
);

-- AddForeignKey (safe: IF NOT EXISTS)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_wallet_styles_tenant_id_fkey'
    ) THEN
        ALTER TABLE "tenant_wallet_styles"
        ADD CONSTRAINT "tenant_wallet_styles_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
