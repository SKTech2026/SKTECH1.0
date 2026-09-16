-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceLocationSource') THEN
    CREATE TYPE "AttendanceLocationSource" AS ENUM (
      'STAFF_QR_SCAN',
      'STAFF_FACE_VERIFY',
      'EVENT_KIOSK',
      'MOBILE_SCANNER',
      'EVENT_CHECK_IN',
      'VOLUNTARY_SHARE'
    );
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AttendanceLocation" (
  "id" TEXT NOT NULL,
  "attendanceId" TEXT NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "accuracy" DOUBLE PRECISION,
  "source" "AttendanceLocationSource" NOT NULL,
  "consentGiven" BOOLEAN NOT NULL DEFAULT true,
  "consentText" TEXT,
  "consentVersion" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AttendanceLocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AttendanceLocation_latitude_check" CHECK ("latitude" >= -90 AND "latitude" <= 90),
  CONSTRAINT "AttendanceLocation_longitude_check" CHECK ("longitude" >= -180 AND "longitude" <= 180),
  CONSTRAINT "AttendanceLocation_accuracy_check" CHECK ("accuracy" IS NULL OR ("accuracy" >= 0 AND "accuracy" <= 100000)),
  CONSTRAINT "AttendanceLocation_consent_check" CHECK ("consentGiven" = true)
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AttendanceLocation_attendanceId_idx" ON "AttendanceLocation"("attendanceId");
CREATE INDEX IF NOT EXISTS "AttendanceLocation_source_idx" ON "AttendanceLocation"("source");
CREATE INDEX IF NOT EXISTS "AttendanceLocation_capturedAt_idx" ON "AttendanceLocation"("capturedAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AttendanceLocation_attendanceId_fkey'
  ) THEN
    ALTER TABLE "AttendanceLocation"
      ADD CONSTRAINT "AttendanceLocation_attendanceId_fkey"
      FOREIGN KEY ("attendanceId") REFERENCES "OfficialAttendance"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
