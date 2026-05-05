import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";



const requireAdminOrStaff = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.status !== UserStatus.APPROVED) {
    return NextResponse.json({ error: "Account is not approved." }, { status: 403 });
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
};

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: "desc" },
    });

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



