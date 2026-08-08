import { prisma } from "@/lib/db";

export const ACTIVE_ANNOUNCEMENT_LIMIT = 5;

export const getAnnouncementCutoff = () => new Date();

export function getActiveAnnouncementWhere(now = getAnnouncementCutoff()) {
  return {
    eventDate: {
      gte: now,
    },
  };
}

export function getArchivedAnnouncementWhere(now = getAnnouncementCutoff()) {
  return {
    eventDate: {
      lt: now,
    },
  };
}

export function getActiveAnnouncements(take = ACTIVE_ANNOUNCEMENT_LIMIT) {
  return prisma.event.findMany({
    where: getActiveAnnouncementWhere(),
    orderBy: { eventDate: "asc" },
    take,
    select: {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      createdAt: true,
    },
  });
}

export function getArchivedAnnouncements(take = 20) {
  return prisma.event.findMany({
    where: getArchivedAnnouncementWhere(),
    orderBy: { eventDate: "desc" },
    take,
    select: {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      createdAt: true,
    },
  });
}
