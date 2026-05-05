-- CreateTable
CREATE TABLE "OfficialAttendance" (
    "id" TEXT NOT NULL,
    "officialId" TEXT NOT NULL,
    "eventId" TEXT,
    "timeIn" TIMESTAMP(3) NOT NULL,
    "timeOut" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialAttendance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OfficialAttendance" ADD CONSTRAINT "OfficialAttendance_officialId_fkey" FOREIGN KEY ("officialId") REFERENCES "SKOfficial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialAttendance" ADD CONSTRAINT "OfficialAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
