-- Phase 2A: permanent termination status foundation.
-- Additive only: no records are deleted or rewritten.

ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'TERMINATED';
ALTER TYPE "OfficialStatus" ADD VALUE IF NOT EXISTS 'TERMINATED';

ALTER TABLE "User"
ADD COLUMN "terminatedAt" TIMESTAMP(3),
ADD COLUMN "terminatedById" TEXT,
ADD COLUMN "terminationReason" TEXT;

CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "User_terminatedAt_idx" ON "User"("terminatedAt");
