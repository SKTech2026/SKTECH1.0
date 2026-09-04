-- Add canonical SK Official profile fields without rewriting existing records.
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

CREATE TYPE "SKFederationPosition" AS ENUM (
  'VICE_PRESIDENT',
  'SECRETARY',
  'TREASURER',
  'AUDITOR',
  'PUBLIC_RELATIONS_OFFICER',
  'SERGEANT_AT_ARMS'
);

ALTER TABLE "SKOfficial"
  ADD COLUMN "suffix" TEXT,
  ADD COLUMN "sex" "Sex",
  ADD COLUMN "sitio" TEXT,
  ADD COLUMN "skFederationOfficer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "skFederationPosition" "SKFederationPosition";
