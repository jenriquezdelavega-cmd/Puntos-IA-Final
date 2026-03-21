CREATE TABLE "tenant_user_password_reset_tokens" (
  "id" TEXT NOT NULL,
  "tenant_user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tenant_user_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_user_password_reset_tokens_token_hash_key"
ON "tenant_user_password_reset_tokens"("token_hash");

CREATE INDEX "tenant_user_password_reset_tokens_tenant_user_id_idx"
ON "tenant_user_password_reset_tokens"("tenant_user_id");

CREATE INDEX "tenant_user_password_reset_tokens_expires_at_idx"
ON "tenant_user_password_reset_tokens"("expires_at");

ALTER TABLE "tenant_user_password_reset_tokens"
ADD CONSTRAINT "tenant_user_password_reset_tokens_tenant_user_id_fkey"
FOREIGN KEY ("tenant_user_id") REFERENCES "TenantUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
