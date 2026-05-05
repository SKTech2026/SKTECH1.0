-- Safely unify SKOfficial admission/profiling columns.
-- Non-destructive and idempotent.

DO $$
BEGIN
  CREATE TYPE "OfficialPosition" AS ENUM (
    'SK_CHAIRPERSON',
    'SK_SECRETARY',
    'SK_TREASURER',
    'SK_COUNCILOR'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "SKOfficial"
ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "province" TEXT,
ADD COLUMN IF NOT EXISTS "municipality" TEXT,
ADD COLUMN IF NOT EXISTS "barangay" TEXT,
ADD COLUMN IF NOT EXISTS "municipalityId" TEXT,
ADD COLUMN IF NOT EXISTS "barangayId" TEXT,
ADD COLUMN IF NOT EXISTS "position" "OfficialPosition",
ADD COLUMN IF NOT EXISTS "dateElected" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "admissionStatus" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "SKOfficial_admissionStatus_idx" ON "SKOfficial"("admissionStatus");
CREATE INDEX IF NOT EXISTS "SKOfficial_municipalityId_idx" ON "SKOfficial"("municipalityId");
CREATE INDEX IF NOT EXISTS "SKOfficial_barangayId_idx" ON "SKOfficial"("barangayId");
CREATE INDEX IF NOT EXISTS "SKOfficial_userId_idx" ON "SKOfficial"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SKOfficial_municipalityId_fkey'
  ) THEN
    ALTER TABLE "SKOfficial"
    ADD CONSTRAINT "SKOfficial_municipalityId_fkey"
    FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SKOfficial_barangayId_fkey'
  ) THEN
    ALTER TABLE "SKOfficial"
    ADD CONSTRAINT "SKOfficial_barangayId_fkey"
    FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
