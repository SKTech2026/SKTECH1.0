DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OfficialOtpPurpose') THEN
    CREATE TYPE "OfficialOtpPurpose" AS ENUM ('LOGIN', 'REGISTER');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "OfficialOTP" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "purpose" "OfficialOtpPurpose" NOT NULL DEFAULT 'LOGIN',
  "firstName" TEXT,
  "lastName" TEXT,
  "passwordHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OfficialOTP_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OfficialOTP_email_idx" ON "OfficialOTP"("email");
CREATE INDEX IF NOT EXISTS "OfficialOTP_expiresAt_idx" ON "OfficialOTP"("expiresAt");
CREATE INDEX IF NOT EXISTS "OfficialOTP_purpose_idx" ON "OfficialOTP"("purpose");