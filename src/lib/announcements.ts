import { prisma } from "@/lib/db";

export const ACTIVE_ANNOUNCEMENT_LIMIT = 5;

export const getAnnouncementCutoff = () => new Date();

const announcementSummarySelect = {
  id: true,
  title: true,
  description: true,
  eventDate: true,
  createdAt: true,
} as const;

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

export async function getActiveAnnouncementIds(
  now = getAnnouncementCutoff(),
  limit = ACTIVE_ANNOUNCEMENT_LIMIT
) {
  const activeAnnouncements = await prisma.event.findMany({
    where: getActiveAnnouncementWhere(now),
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit,
    select: { id: true },
  });

  return activeAnnouncements.map((announcement) => announcement.id);
}

export async function getActiveAnnouncements(take = ACTIVE_ANNOUNCEMENT_LIMIT) {
  const now = getAnnouncementCutoff();
  const activeIds = await getActiveAnnouncementIds(now);

  if (activeIds.length === 0 || take <= 0) {
    return [];
  }

  return prisma.event.findMany({
    where: {
      id: { in: activeIds.slice(0, take) },
      ...getActiveAnnouncementWhere(now),
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take,
    select: announcementSummarySelect,
  });
}

export async function getArchivedAnnouncements(take = 20) {
  const now = getAnnouncementCutoff();
  const activeIds = await getActiveAnnouncementIds(now);

  return prisma.event.findMany({
    where: {
      OR: [
        getArchivedAnnouncementWhere(now),
        {
          eventDate: {
            gte: now,
          },
          id: {
            notIn: activeIds,
          },
        },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { eventDate: "desc" }, { id: "asc" }],
    take,
    select: announcementSummarySelect,
  });
}
