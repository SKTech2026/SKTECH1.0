-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE');

-- Normalize Role enum from SK_OFFICIAL -> OFFICIAL without data loss
BEGIN;
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
ALTER TABLE "VerificationCode" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
UPDATE "User" SET "role" = 'OFFICIAL' WHERE "role" = 'SK_OFFICIAL';
UPDATE "VerificationCode" SET "role" = 'OFFICIAL' WHERE "role" = 'SK_OFFICIAL';
DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'OFFICIAL');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "VerificationCode" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OFFICIAL';
COMMIT;

-- Add approval state for official onboarding and access control
ALTER TABLE "User"
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- Preserve access for existing users after migration
UPDATE "User"
SET "status" = 'APPROVED'
WHERE "role" IN ('ADMIN', 'STAFF', 'OFFICIAL');

-- Query helper index for pending approvals and filters
CREATE INDEX "User_status_idx" ON "User"("status");
