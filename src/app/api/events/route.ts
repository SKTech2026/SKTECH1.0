import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { requireApiRole } from "@/lib/api-auth";
import {
  getActiveAnnouncementIds,
  getActiveAnnouncementWhere,
  getArchivedAnnouncementWhere,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";



const requireAdminOrStaff = async () => {
  const guard = await requireApiRole([Role.ADMIN, Role.STAFF]);
  return guard.error ?? null;
};

export async function GET() {
  try {
    const authError = await requireAdminOrStaff();
    if (authError) {
      return authError;
    }

    const now = new Date();
    const activeAnnouncementIds = await getActiveAnnouncementIds(now);
    const [activeEvents, archivedEvents] = await Promise.all([
      prisma.event.findMany({
        where: {
          id: { in: activeAnnouncementIds },
          ...getActiveAnnouncementWhere(now),
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        include: {
          _count: {
            select: { officialAttendances: true },
          },
        },
      }),
      prisma.event.findMany({
        where: {
          OR: [
            getArchivedAnnouncementWhere(now),
            {
              eventDate: {
                gte: now,
              },
              id: {
                notIn: activeAnnouncementIds,
              },
            },
          ],
        },
        orderBy: [{ createdAt: "desc" }, { eventDate: "desc" }, { id: "asc" }],
        include: {
          _count: {
            select: { officialAttendances: true },
          },
        },
      }),
    ]);

    const events = [
      ...activeEvents.map((event) => ({ ...event, announcementStatus: "ACTIVE" })),
      ...archivedEvents.map((event) => ({ ...event, announcementStatus: "ARCHIVED" })),
    ];

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdminOrStaff();
    if (authError) {
      return authError;
    }

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      eventDate?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
    const eventDateInput =
      typeof body.eventDate === "string" ? body.eventDate.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!eventDateInput) {
      return NextResponse.json(
        { error: "eventDate is required" },
        { status: 400 }
      );
    }

    const parsedEventDate = new Date(eventDateInput);
    if (Number.isNaN(parsedEventDate.getTime())) {
      return NextResponse.json(
        { error: "eventDate must be a valid date" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: parsedEventDate,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}



