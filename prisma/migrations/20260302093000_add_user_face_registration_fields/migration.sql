-- Safe extension for biometric enrollment state and encrypted embedding storage
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "faceEmbedding" TEXT;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "faceRegistered" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "User_faceRegistered_idx" ON "User"("faceRegistered");
