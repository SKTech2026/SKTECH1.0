-- CreateEnum
CREATE TYPE "KKProfileStatus" AS ENUM ('DRAFT', 'PENDING_EMAIL_VERIFICATION', 'PENDING_VERIFICATION', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'KK_MEMBER';

-- CreateTable
CREATE TABLE "KKInvitation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KKInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KKRegistrationOTP" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KKRegistrationOTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KKMemberProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "status" "KKProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "suffix" TEXT,
    "region" TEXT,
    "province" TEXT,
    "purokZone" TEXT,
    "sexAssignedAtBirth" TEXT,
    "birthdate" TIMESTAMP(3),
    "age" INTEGER,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT,
    "civilStatus" TEXT,
    "youthAgeGroup" TEXT,
    "educationalBackground" TEXT,
    "youthClassification" TEXT,
    "specificNeedsCategory" TEXT,
    "workStatus" TEXT,
    "registeredSkVoter" BOOLEAN,
    "registeredNationalVoter" BOOLEAN,
    "votedLastElection" BOOLEAN,
    "attendedKkAssembly" BOOLEAN,
    "kkAssemblyAttendanceFrequency" TEXT,
    "noKkAssemblyReason" TEXT,
    "dataPrivacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "profilingConsent" BOOLEAN NOT NULL DEFAULT false,
    "aggregateReportingConsent" BOOLEAN NOT NULL DEFAULT false,
    "communicationConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KKMemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KKInvitation_code_key" ON "KKInvitation"("code");

-- CreateIndex
CREATE INDEX "KKInvitation_barangayId_active_expiresAt_idx" ON "KKInvitation"("barangayId", "active", "expiresAt");

-- CreateIndex
CREATE INDEX "KKInvitation_createdById_idx" ON "KKInvitation"("createdById");

-- CreateIndex
CREATE INDEX "KKRegistrationOTP_expiresAt_idx" ON "KKRegistrationOTP"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "KKRegistrationOTP_invitationId_email_key" ON "KKRegistrationOTP"("invitationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "KKMemberProfile_userId_key" ON "KKMemberProfile"("userId");

-- CreateIndex
CREATE INDEX "KKMemberProfile_barangayId_status_createdAt_idx" ON "KKMemberProfile"("barangayId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "KKMemberProfile_barangayId_lastName_firstName_birthdate_idx" ON "KKMemberProfile"("barangayId", "lastName", "firstName", "birthdate");

-- AddForeignKey
ALTER TABLE "KKInvitation" ADD CONSTRAINT "KKInvitation_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KKInvitation" ADD CONSTRAINT "KKInvitation_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KKInvitation" ADD CONSTRAINT "KKInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KKRegistrationOTP" ADD CONSTRAINT "KKRegistrationOTP_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "KKInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KKMemberProfile" ADD CONSTRAINT "KKMemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KKMemberProfile" ADD CONSTRAINT "KKMemberProfile_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "KKInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KKMemberProfile" ADD CONSTRAINT "KKMemberProfile_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KKMemberProfile" ADD CONSTRAINT "KKMemberProfile_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Server-side Prisma access only; no Data API policies expose KK records.
ALTER TABLE "KKInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KKRegistrationOTP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KKMemberProfile" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "KKMemberProfile" ADD CONSTRAINT "KKMemberProfile_age_range_check"
  CHECK ("age" IS NULL OR "age" BETWEEN 15 AND 30);
