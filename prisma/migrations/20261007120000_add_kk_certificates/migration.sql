CREATE TYPE "KKCertificateType" AS ENUM ('PARTICIPATION', 'ATTENDANCE', 'APPRECIATION', 'VOLUNTEER_SERVICE');
CREATE TYPE "KKCertificateStatus" AS ENUM ('ISSUED', 'REVOKED');

CREATE TABLE "KKCertificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "kkMemberProfileId" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "certificateType" "KKCertificateType" NOT NULL,
    "description" TEXT,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "KKCertificateStatus" NOT NULL DEFAULT 'ISSUED',
    "verificationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KKCertificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KKCertificate_certificateNumber_key"
    ON "KKCertificate"("certificateNumber");

CREATE UNIQUE INDEX "KKCertificate_verificationCode_key"
    ON "KKCertificate"("verificationCode");

CREATE INDEX "KKCertificate_kkMemberProfileId_issuedAt_idx"
    ON "KKCertificate"("kkMemberProfileId", "issuedAt");

CREATE INDEX "KKCertificate_status_issuedAt_idx"
    ON "KKCertificate"("status", "issuedAt");

CREATE INDEX "KKCertificate_eventId_idx"
    ON "KKCertificate"("eventId");

ALTER TABLE "KKCertificate"
    ADD CONSTRAINT "KKCertificate_kkMemberProfileId_fkey"
    FOREIGN KEY ("kkMemberProfileId") REFERENCES "KKMemberProfile"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KKCertificate"
    ADD CONSTRAINT "KKCertificate_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KKCertificate"
    ADD CONSTRAINT "KKCertificate_issuedByUserId_fkey"
    FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
