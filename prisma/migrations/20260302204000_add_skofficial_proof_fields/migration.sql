-- Safe, non-destructive extension for unified admission proof storage.
ALTER TABLE "SKOfficial"
ADD COLUMN IF NOT EXISTS "proofDocumentUrl" TEXT,
ADD COLUMN IF NOT EXISTS "proofDocumentName" TEXT,
ADD COLUMN IF NOT EXISTS "proofDocumentType" TEXT;
