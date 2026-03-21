CREATE TABLE "phone_verification_codes" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phone_verification_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "phone_verification_codes_user_id_created_at_idx"
ON "phone_verification_codes"("user_id", "created_at");

CREATE INDEX "phone_verification_codes_expires_at_idx"
ON "phone_verification_codes"("expires_at");

ALTER TABLE "phone_verification_codes"
ADD CONSTRAINT "phone_verification_codes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
