-- CreateEnum
CREATE TYPE "IdTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IdTemplateSide" AS ENUM ('FRONT', 'BACK');

-- CreateEnum
CREATE TYPE "IdTemplateFieldType" AS ENUM ('STATIC_TEXT', 'TEXT', 'IMAGE', 'QR', 'SHAPE');

-- CreateEnum
CREATE TYPE "IdTemplateAssetKind" AS ENUM ('BACKGROUND', 'LOGO', 'IMAGE');

-- CreateTable
CREATE TABLE "IdTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "IdTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "canvasWidth" DOUBLE PRECISION NOT NULL,
    "canvasHeight" DOUBLE PRECISION NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IdTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdTemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "side" "IdTemplateSide" NOT NULL,
    "type" "IdTemplateFieldType" NOT NULL,
    "sourceKey" TEXT,
    "staticValue" TEXT,
    "label" TEXT,
    "xPercent" DOUBLE PRECISION NOT NULL,
    "yPercent" DOUBLE PRECISION NOT NULL,
    "widthPercent" DOUBLE PRECISION NOT NULL,
    "heightPercent" DOUBLE PRECISION NOT NULL,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "fit" TEXT,
    "radius" DOUBLE PRECISION,
    "styleJson" JSONB,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IdTemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdTemplateAsset" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "side" "IdTemplateSide" NOT NULL,
    "kind" "IdTemplateAssetKind" NOT NULL,
    "objectPath" TEXT,
    "publicUrl" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdTemplateAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdTemplate_status_idx" ON "IdTemplate"("status");
CREATE INDEX "IdTemplate_isActive_idx" ON "IdTemplate"("isActive");
CREATE UNIQUE INDEX "IdTemplate_one_active_template_idx" ON "IdTemplate"("isActive") WHERE "isActive" = true;
CREATE INDEX "IdTemplate_createdById_idx" ON "IdTemplate"("createdById");
CREATE INDEX "IdTemplate_updatedById_idx" ON "IdTemplate"("updatedById");
CREATE INDEX "IdTemplate_archivedAt_idx" ON "IdTemplate"("archivedAt");
CREATE INDEX "IdTemplate_createdAt_idx" ON "IdTemplate"("createdAt");
CREATE INDEX "IdTemplateField_templateId_idx" ON "IdTemplateField"("templateId");
CREATE INDEX "IdTemplateField_templateId_side_idx" ON "IdTemplateField"("templateId", "side");
CREATE INDEX "IdTemplateField_templateId_visible_idx" ON "IdTemplateField"("templateId", "visible");
CREATE INDEX "IdTemplateField_side_idx" ON "IdTemplateField"("side");
CREATE INDEX "IdTemplateField_type_idx" ON "IdTemplateField"("type");
CREATE INDEX "IdTemplateField_sourceKey_idx" ON "IdTemplateField"("sourceKey");
CREATE INDEX "IdTemplateField_zIndex_idx" ON "IdTemplateField"("zIndex");
CREATE INDEX "IdTemplateAsset_templateId_idx" ON "IdTemplateAsset"("templateId");
CREATE INDEX "IdTemplateAsset_templateId_side_idx" ON "IdTemplateAsset"("templateId", "side");
CREATE INDEX "IdTemplateAsset_kind_idx" ON "IdTemplateAsset"("kind");

-- AddForeignKey
ALTER TABLE "IdTemplate" ADD CONSTRAINT "IdTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IdTemplate" ADD CONSTRAINT "IdTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IdTemplateField" ADD CONSTRAINT "IdTemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IdTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdTemplateAsset" ADD CONSTRAINT "IdTemplateAsset_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IdTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
