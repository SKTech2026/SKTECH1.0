ALTER TABLE "KKInvitation"
  DROP CONSTRAINT "KKInvitation_createdById_fkey",
  ALTER COLUMN "createdById" DROP NOT NULL;

ALTER TABLE "KKInvitation"
  ADD CONSTRAINT "KKInvitation_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "KKCertificate"
  DROP CONSTRAINT "KKCertificate_issuedByUserId_fkey",
  ALTER COLUMN "issuedByUserId" DROP NOT NULL;

ALTER TABLE "KKCertificate"
  ADD CONSTRAINT "KKCertificate_issuedByUserId_fkey"
  FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  DROP CONSTRAINT "AuditLog_userId_fkey",
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;