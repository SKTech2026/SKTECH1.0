-- Municipality-restricted one-to-one chat v1.
-- Additive and non-destructive.

CREATE TABLE IF NOT EXISTS "ChatConversation" (
  "id" TEXT NOT NULL,
  "municipalityId" TEXT NOT NULL,
  "directKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatConversation_municipalityId_fkey"
    FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatParticipant" (
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastReadAt" TIMESTAMP(3),

  CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("conversationId", "userId"),
  CONSTRAINT "ChatParticipant_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatParticipant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatMessage_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatAttachment" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "objectPath" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatAttachment_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChatConversation_directKey_key"
  ON "ChatConversation"("directKey");
CREATE INDEX IF NOT EXISTS "ChatConversation_municipalityId_idx"
  ON "ChatConversation"("municipalityId");
CREATE INDEX IF NOT EXISTS "ChatConversation_updatedAt_idx"
  ON "ChatConversation"("updatedAt");
CREATE INDEX IF NOT EXISTS "ChatParticipant_userId_idx"
  ON "ChatParticipant"("userId");
CREATE INDEX IF NOT EXISTS "ChatParticipant_lastReadAt_idx"
  ON "ChatParticipant"("lastReadAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_createdAt_idx"
  ON "ChatMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_idx"
  ON "ChatMessage"("senderId");
CREATE INDEX IF NOT EXISTS "ChatAttachment_messageId_idx"
  ON "ChatAttachment"("messageId");
CREATE INDEX IF NOT EXISTS "ChatAttachment_objectPath_idx"
  ON "ChatAttachment"("objectPath");
