DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OfficialPosition') THEN
    CREATE TYPE "OfficialPosition" AS ENUM ('SK_CHAIRPERSON', 'SK_SECRETARY', 'SK_TREASURER', 'SK_COUNCILOR');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SKOfficialProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "province" TEXT NOT NULL,
  "municipality" TEXT NOT NULL,
  "barangay" TEXT NOT NULL,
  "position" "OfficialPosition" NOT NULL,
  "dateElected" TIMESTAMP(3) NOT NULL,
  "termStart" TIMESTAMP(3) NOT NULL,
  "termEnd" TIMESTAMP(3) NOT NULL,
  "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SKOfficialProfile_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SKOfficialProfile_userId_fkey'
  ) THEN
    ALTER TABLE "SKOfficialProfile"
      ADD CONSTRAINT "SKOfficialProfile_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "SKOfficialProfile_userId_key" ON "SKOfficialProfile"("userId");
CREATE INDEX IF NOT EXISTS "SKOfficialProfile_status_idx" ON "SKOfficialProfile"("status");