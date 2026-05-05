import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



const requireAdminOrStaff = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { session };
};

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error;
    }

    const eventId = request.nextUrl.searchParams.get("eventId");
    const currentSession = guard.session;
    const staffMunicipalityId =
      currentSession.user.role === Role.STAFF
        ? (currentSession.user.municipalityPresidentId ?? null)
        : null;

    if (currentSession.user.role === Role.STAFF && !staffMunicipalityId) {
      return NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      );
    }

    const records = await prisma.officialAttendance.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(staffMunicipalityId
          ? {
              official: {
                user: {
                  municipalityOfficerId: staffMunicipalityId,
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        official: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const response = records.map((record) => ({
      id: record.id,
      officialId: record.officialId,
      firstName: record.official.firstName,
      lastName: record.official.lastName,
      eventId: record.eventId,
      timeIn: record.timeIn,
      timeOut: record.timeOut,
      createdAt: record.createdAt,
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/attendance/recent error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent attendance" },
      { status: 500 },
    );
  }
}



