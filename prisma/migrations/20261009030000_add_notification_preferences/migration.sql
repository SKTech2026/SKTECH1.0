CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "pushChat" BOOLEAN NOT NULL DEFAULT true,
  "pushAnnouncements" BOOLEAN NOT NULL DEFAULT true,
  "pushKkProfile" BOOLEAN NOT NULL DEFAULT true,
  "pushCertificates" BOOLEAN NOT NULL DEFAULT true,
  "pushAdmissions" BOOLEAN NOT NULL DEFAULT true,
  "pushSystem" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NotificationPreference_userId_key" UNIQUE ("userId"),
  CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);