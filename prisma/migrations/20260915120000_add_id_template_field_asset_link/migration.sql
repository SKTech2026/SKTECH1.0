-- Add nullable template asset references for uploaded image fields.
ALTER TABLE "IdTemplateField" ADD COLUMN "assetId" TEXT;

CREATE INDEX "IdTemplateField_assetId_idx" ON "IdTemplateField"("assetId");

ALTER TABLE "IdTemplateField"
  ADD CONSTRAINT "IdTemplateField_assetId_fkey"
  FOREIGN KEY ("assetId")
  REFERENCES "IdTemplateAsset"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
