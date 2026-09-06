-- Staff-approved Official profile and photo changes.
CREATE TYPE "ProfileChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "FaceCheckStatus" AS ENUM ('NOT_CHECKED', 'MATCHED', 'MISMATCHED', 'UNAVAILABLE');

CREATE TABLE "OfficialProfileChangeRequest" (
  "id" TEXT NOT NULL,
  "officialId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "municipalityId" TEXT NOT NULL,
  "status" "ProfileChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedChanges" JSONB NOT NULL,
  "currentSnapshot" JSONB NOT NULL,
  "requestedPhotoUrl" TEXT,
  "faceMatchScore" DOUBLE PRECISION,
  "faceCheckStatus" "FaceCheckStatus" NOT NULL DEFAULT 'NOT_CHECKED',
  "staffReviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OfficialProfileChangeRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OfficialProfileChangeRequest_officialId_fkey"
    FOREIGN KEY ("officialId") REFERENCES "SKOfficial"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfficialProfileChangeRequest_requestedByUserId_fkey"
    FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfficialProfileChangeRequest_municipalityId_fkey"
    FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OfficialProfileChangeRequest_staffReviewerId_fkey"
    FOREIGN KEY ("staffReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OfficialProfileChangeRequest_officialId_status_idx"
  ON "OfficialProfileChangeRequest"("officialId", "status");
CREATE INDEX "OfficialProfileChangeRequest_municipalityId_status_createdAt_idx"
  ON "OfficialProfileChangeRequest"("municipalityId", "status", "createdAt");
CREATE INDEX "OfficialProfileChangeRequest_requestedByUserId_status_idx"
  ON "OfficialProfileChangeRequest"("requestedByUserId", "status");
CREATE UNIQUE INDEX "OfficialProfileChangeRequest_one_pending_per_official_key"
  ON "OfficialProfileChangeRequest"("officialId")
  WHERE "status" = 'PENDING';
