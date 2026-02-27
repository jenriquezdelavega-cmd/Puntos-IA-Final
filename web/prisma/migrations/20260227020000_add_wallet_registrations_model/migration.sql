-- CreateTable (safe: IF NOT EXISTS preserves existing registrations)
CREATE TABLE IF NOT EXISTS "apple_wallet_registrations" (
    "serial_number" TEXT NOT NULL,
    "pass_type_identifier" TEXT NOT NULL,
    "device_library_identifier" TEXT NOT NULL,
    "push_token" TEXT NOT NULL,
    "auth_token" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "apple_wallet_registrations_pkey" PRIMARY KEY ("serial_number", "pass_type_identifier", "device_library_identifier")
);
