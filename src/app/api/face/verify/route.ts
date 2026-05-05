import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyFaceAgainstEmbeddings } from "@/lib/face-ai";

export const dynamic = "force-dynamic";



interface VerifyFaceRequestBody {
  imageBase64?: string;
  livenessFrames?: string[];
  threshold?: number;
  eventId?: string;
  autoRecord?: boolean;
}

type FaceStatus =
  | "VERIFIED"
  | "LOW_CONFIDENCE"
  | "UNREGISTERED"
  | "OUT_OF_SCOPE"
  | "LIVENESS_FAILED";

const VERIFIED_CONFIDENCE_THRESHOLD = 0.7;
const DUPLICATE_ATTENDANCE_WINDOW_MS = 30_000;

interface FacePayload {
  faceIndex: number;
  box: [number, number, number, number] | number[];
  confidence: number;
  distance: number;
  status: FaceStatus;
  userId: string | null;
  officialId: string | null;
  fullName: string | null;
  role: string | null;
  municipality: string | null;
  attendance:
    | {
        status: "MARKED" | "SKIPPED_DUPLICATE";
        attendanceId: string | null;
        timestamp: string | null;
      }
    | null;
}

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

async function markAttendanceOnce(officialId: string, eventId?: string | null) {
  const now = new Date();
  const duplicateSince = new Date(now.getTime() - DUPLICATE_ATTENDANCE_WINDOW_MS);
  const normalizedEventId = eventId ?? null;

  const duplicateWhere = normalizedEventId
    ? {
        officialId,
        eventId: normalizedEventId,
        timeIn: {
          gte: duplicateSince,
        },
      }
    : {
        officialId,
        eventId: null as null,
        timeIn: {
          gte: duplicateSince,
        },
      };

  const existing = await prisma.officialAttendance.findFirst({
    where: duplicateWhere,
    orderBy: { timeIn: "desc" },
  });

  if (existing) {
    return {
      status: "SKIPPED_DUPLICATE" as const,
      attendanceId: existing.id,
      timestamp: existing.timeIn.toISOString(),
    };
  }

  const attendance = await prisma.officialAttendance.create({
    data: {
      officialId,
      eventId: normalizedEventId,
      timeIn: now,
    },
  });

  return {
    status: "MARKED" as const,
    attendanceId: attendance.id,
    timestamp: attendance.timeIn.toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdminOrStaff();
    if (guard.error) {
      return guard.error;
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

    const body = (await request.json()) as VerifyFaceRequestBody;
    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return NextResponse.json({ error: "imageBase64 is required." }, { status: 400 });
    }

    const livenessFrames = Array.isArray(body.livenessFrames)
      ? body.livenessFrames.filter((frame) => typeof frame === "string")
      : [];

    if (body.eventId && typeof body.eventId !== "string") {
      return NextResponse.json({ error: "eventId must be a string." }, { status: 400 });
    }

    if (body.eventId) {
      const event = await prisma.event.findUnique({ where: { id: body.eventId } });
      if (!event) {
        return NextResponse.json({ error: "Event not found." }, { status: 404 });
      }
    }

    const aiResponse = await verifyFaceAgainstEmbeddings({
      imageBase64: body.imageBase64,
      livenessFrames,
      threshold: typeof body.threshold === "number" ? body.threshold : undefined,
    });

    const recognizedUserIds = Array.from(
      new Set(
        aiResponse.faces
          .filter((face) => face.isRegistered && face.isLive && !!face.userId)
          .map((face) => face.userId as string),
      ),
    );

    const officials = recognizedUserIds.length
      ? await prisma.sKOfficial.findMany({
          where: {
            userId: { in: recognizedUserIds },
          },
          include: {
            user: {
              select: {
                municipalityOfficerId: true,
              },
            },
          },
        })
      : [];

    const officialByUserId = new Map(
      officials
        .filter((official) => !!official.userId)
        .map((official) => [official.userId as string, official]),
    );

    const shouldAutoRecord = body.autoRecord !== false;
    const alreadyProcessedInFrame = new Set<string>();
    const faces: FacePayload[] = [];

    for (let index = 0; index < aiResponse.faces.length; index += 1) {
      const face = aiResponse.faces[index];

      if (!face.isLive || !aiResponse.livenessPassed) {
        faces.push({
          faceIndex: index,
          box: face.box,
          confidence: face.confidence,
          distance: face.distance,
          status: "LIVENESS_FAILED",
          userId: null,
          officialId: null,
          fullName: null,
          role: null,
          municipality: null,
          attendance: null,
        });
        continue;
      }

      if (!face.userId || !face.isRegistered) {
        faces.push({
          faceIndex: index,
          box: face.box,
          confidence: face.confidence,
          distance: face.distance,
          status: "UNREGISTERED",
          userId: null,
          officialId: null,
          fullName: null,
          role: null,
          municipality: null,
          attendance: null,
        });
        continue;
      }

      const official = officialByUserId.get(face.userId);
      if (!official) {
        faces.push({
          faceIndex: index,
          box: face.box,
          confidence: face.confidence,
          distance: face.distance,
          status: "UNREGISTERED",
          userId: face.userId,
          officialId: null,
          fullName: face.fullName,
          role: face.role,
          municipality: face.municipality,
          attendance: null,
        });
        continue;
      }

      if (
        staffMunicipalityId &&
        official.user?.municipalityOfficerId !== staffMunicipalityId
      ) {
        faces.push({
          faceIndex: index,
          box: face.box,
          confidence: face.confidence,
          distance: face.distance,
          status: "OUT_OF_SCOPE",
          userId: face.userId,
          officialId: official.id,
          fullName: face.fullName ?? `${official.firstName} ${official.lastName}`,
          role: face.role ?? official.role,
          municipality: face.municipality,
          attendance: null,
        });
        continue;
      }

      const status: FaceStatus =
        face.confidence >= VERIFIED_CONFIDENCE_THRESHOLD ? "VERIFIED" : "LOW_CONFIDENCE";
      let attendance: FacePayload["attendance"] = null;

      if (shouldAutoRecord && status === "VERIFIED") {
        if (alreadyProcessedInFrame.has(face.userId)) {
          attendance = {
            status: "SKIPPED_DUPLICATE",
            attendanceId: null,
            timestamp: null,
          };
        } else {
          const marked = await markAttendanceOnce(official.id, body.eventId ?? null);
          attendance = marked;
          alreadyProcessedInFrame.add(face.userId);

          if (marked.status === "MARKED") {
            await prisma.auditLog.create({
              data: {
                action: "FACE_VERIFIED_ATTENDANCE_MARKED",
                model: "OfficialAttendance",
                recordId: marked.attendanceId ?? official.id,
                userId: currentSession.user.id,
              },
            });
          }
        }
      }

      faces.push({
        faceIndex: index,
        box: face.box,
        confidence: face.confidence,
        distance: face.distance,
        status,
        userId: face.userId,
        officialId: official.id,
        fullName: face.fullName ?? `${official.firstName} ${official.lastName}`,
        role: face.role ?? official.role,
        municipality: face.municipality,
        attendance,
      });
    }

    const verifiedFaces = faces.filter((face) => face.status === "VERIFIED");
    const latestMatch = verifiedFaces.sort((a, b) => b.confidence - a.confidence)[0] ?? null;

    return NextResponse.json(
      {
        success: true,
        message: aiResponse.message,
        livenessPassed: aiResponse.livenessPassed,
        livenessScore: aiResponse.livenessScore,
        totalFaces: aiResponse.totalFaces,
        matchedCount: verifiedFaces.length,
        faces,
        latestMatch,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/face/verify error:", error);
    const message = error instanceof Error ? error.message : "Face verification failed.";
    const normalized = message.toLowerCase();
    const statusCode =
      normalized.includes("too many") || normalized.includes("rate limit") ? 429 : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status: statusCode },
    );
  }
}



