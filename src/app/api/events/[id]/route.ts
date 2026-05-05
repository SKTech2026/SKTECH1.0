import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";



type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authError = await requireAdminOrStaff();
    if (authError) {
      return authError;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.officialAttendance.deleteMany({
        where: { eventId: id },
      }),
      prisma.event.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}



