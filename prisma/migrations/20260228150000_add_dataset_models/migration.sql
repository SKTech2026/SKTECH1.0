-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('SK_CHAIRPERSON', 'SK_SECRETARY', 'SK_TREASURER', 'SK_COUNCILOR');

-- DropIndex
DROP INDEX IF EXISTS "User_status_idx";

-- CreateTable
CREATE TABLE "OfficialAdmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "provinceDistrict" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "municipalityDistrict" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "municipalityId" TEXT,
    "barangayId" TEXT,
    "position" "Position" NOT NULL,
    "dateElected" TIMESTAMP(3) NOT NULL,
    "termEndDate" TIMESTAMP(3) NOT NULL,
    "admissionStatus" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficialAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetRecord" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "DatasetRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfficialAdmission_userId_idx" ON "OfficialAdmission"("userId");

-- CreateIndex
CREATE INDEX "OfficialAdmission_admissionStatus_idx" ON "OfficialAdmission"("admissionStatus");

-- CreateIndex
CREATE INDEX "OfficialAdmission_municipalityId_idx" ON "OfficialAdmission"("municipalityId");

-- CreateIndex
CREATE INDEX "OfficialAdmission_barangayId_idx" ON "OfficialAdmission"("barangayId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialAdmission_userId_version_key" ON "OfficialAdmission"("userId", "version");

-- CreateIndex
CREATE INDEX "Dataset_createdAt_idx" ON "Dataset"("createdAt");

-- CreateIndex
CREATE INDEX "Dataset_uploadedBy_idx" ON "Dataset"("uploadedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_name_uploadedBy_key" ON "Dataset"("name", "uploadedBy");

-- CreateIndex
CREATE INDEX "DatasetRecord_datasetId_idx" ON "DatasetRecord"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetRecord_category_idx" ON "DatasetRecord"("category");

-- AddForeignKey
ALTER TABLE "OfficialAdmission" ADD CONSTRAINT "OfficialAdmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialAdmission" ADD CONSTRAINT "OfficialAdmission_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialAdmission" ADD CONSTRAINT "OfficialAdmission_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetRecord" ADD CONSTRAINT "DatasetRecord_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
