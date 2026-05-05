-- Reconcile historical drift for municipality governance columns and relations.
-- This migration is intentionally idempotent and non-destructive.

ALTER TABLE "Municipality"
ADD COLUMN IF NOT EXISTS "province" TEXT NOT NULL DEFAULT 'Oriental Mindoro';

ALTER TABLE "Municipality"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Municipality"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "municipalityOfficerId" TEXT;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "municipalityPresidentId" TEXT;

CREATE INDEX IF NOT EXISTS "User_municipalityOfficerId_idx" ON "User"("municipalityOfficerId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_municipalityPresidentId_key" ON "User"("municipalityPresidentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_municipalityOfficerId_fkey'
  ) THEN
    ALTER TABLE "User"
    ADD CONSTRAINT "User_municipalityOfficerId_fkey"
    FOREIGN KEY ("municipalityOfficerId") REFERENCES "Municipality"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_municipalityPresidentId_fkey'
  ) THEN
    ALTER TABLE "User"
    ADD CONSTRAINT "User_municipalityPresidentId_fkey"
    FOREIGN KEY ("municipalityPresidentId") REFERENCES "Municipality"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
