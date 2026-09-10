import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



interface ScanRequest {
  officialId: string;
  eventId: string;
  attendanceType: "TIME_IN" | "TIME_OUT";
}

interface ScanResponse {
  success: boolean;
  action: "CHECK_IN" | "CHECK_OUT";
  attendance: {
    id: string;
    officialId: string;
    firstName: string;
    lastName: string;
    timeIn: string;
    timeOut: string | null;
  };
  message: string;
}

const requireAdminOrStaff = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });
  if (!currentUser || currentUser.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { session };
};

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ScanResponse | { error: string }>> {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error as NextResponse<{ error: string }>;
    }

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

    const body = (await request.json()) as ScanRequest;
    const { officialId, eventId, attendanceType } = body;

    if (!officialId || typeof officialId !== "string") {
      return NextResponse.json(
        { error: "officialId is required and must be a string" },
        { status: 400 },
      );
    }

    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json(
        { error: "eventId is required and must be a string" },
        { status: 400 },
      );
    }

    if (attendanceType !== "TIME_IN" && attendanceType !== "TIME_OUT") {
      return NextResponse.json(
        { error: "attendanceType must be TIME_IN or TIME_OUT" },
        { status: 400 },
      );
    }

    const official = await prisma.sKOfficial.findUnique({
      where: { id: officialId },
      include: {
        user: {
          select: {
            municipalityOfficerId: true,
          },
        },
      },
    });

    if (!official) {
      return NextResponse.json({ error: "Official not found" }, { status: 404 });
    }

    if (
      staffMunicipalityId &&
      official.user?.municipalityOfficerId !== staffMunicipalityId
    ) {
      return NextResponse.json(
        { error: "You can only scan officials in your assigned municipality." },
        { status: 403 },
      );
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        ...(staffMunicipalityId ? { municipalityId: staffMunicipalityId } : {}),
      },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existingAttendance = await prisma.officialAttendance.findFirst({
      where: {
        officialId,
        eventId,
        timeOut: null,
      },
      orderBy: { timeIn: "desc" },
    });

    let attendance;
    let action: "CHECK_IN" | "CHECK_OUT";
    let message: string;

    if (attendanceType === "TIME_OUT") {
      if (!existingAttendance) {
        return NextResponse.json(
          { error: "No open Time In record exists for this official and event." },
          { status: 409 },
        );
      }

      attendance = await prisma.officialAttendance.update({
        where: { id: existingAttendance.id },
        data: { timeOut: new Date() },
      });
      action = "CHECK_OUT";
      message = `${official.firstName} ${official.lastName} timed out`;
    } else if (!existingAttendance) {
      attendance = await prisma.officialAttendance.create({
        data: {
          officialId,
          eventId,
          timeIn: new Date(),
        },
      });
      action = "CHECK_IN";
      message = `${official.firstName} ${official.lastName} timed in`;
    } else {
      return NextResponse.json(
        { error: "An open Time In record already exists for this official and event." },
        { status: 409 },
      );
    }

    const response: ScanResponse = {
      success: true,
      action,
      attendance: {
        id: attendance.id,
        officialId: attendance.officialId,
        firstName: official.firstName,
        lastName: official.lastName,
        timeIn: attendance.timeIn.toISOString(),
        timeOut: attendance.timeOut ? attendance.timeOut.toISOString() : null,
      },
      message,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/attendance/scan error:", error);
    return NextResponse.json(
      { error: "Failed to process attendance scan" },
      { status: 500 },
    );
  }
}



