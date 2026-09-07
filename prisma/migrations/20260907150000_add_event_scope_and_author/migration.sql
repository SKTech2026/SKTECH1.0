ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "municipalityId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

CREATE INDEX IF NOT EXISTS "Event_municipalityId_createdAt_idx"
  ON "Event"("municipalityId", "createdAt");
CREATE INDEX IF NOT EXISTS "Event_createdById_createdAt_idx"
  ON "Event"("createdById", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Event_municipalityId_fkey'
  ) THEN
    ALTER TABLE "Event"
      ADD CONSTRAINT "Event_municipalityId_fkey"
      FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Event_createdById_fkey'
  ) THEN
    ALTER TABLE "Event"
      ADD CONSTRAINT "Event_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;