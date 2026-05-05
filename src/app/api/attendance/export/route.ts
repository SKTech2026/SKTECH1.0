import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



const toCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

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

    const rawEventId = request.nextUrl.searchParams.get("eventId");
    const eventId = rawEventId && rawEventId.trim() ? rawEventId.trim() : null;
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
      include: {
        official: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const header = "Name,Event ID,Time In,Time Out,Status,Created At";
    const rows = records.map((record) => {
      const name = `${record.official.firstName} ${record.official.lastName}`;
      const status = record.timeOut === null ? "Checked In" : "Checked Out";

      return [
        toCsvCell(name),
        toCsvCell(record.eventId ?? ""),
        toCsvCell(record.timeIn.toISOString()),
        toCsvCell(record.timeOut ? record.timeOut.toISOString() : ""),
        toCsvCell(status),
        toCsvCell(record.createdAt.toISOString()),
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="attendance-export.csv"',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/attendance/export error:", error);
    return NextResponse.json(
      { error: "Failed to export attendance CSV" },
      { status: 500 }
    );
  }
}



