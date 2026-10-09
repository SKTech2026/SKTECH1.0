-- Nullable unique keys allow older/manual notifications to remain unaffected.
ALTER TABLE "AppNotification" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "AppNotification_dedupeKey_key" ON "AppNotification"("dedupeKey");