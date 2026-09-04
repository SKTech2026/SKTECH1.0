import { Role } from "@prisma/client";
import { GetFaceLivenessSessionResultsCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { registerFaceEmbeddingFromReferenceImage } from "@/lib/face-ai";

export const dynamic = "force-dynamic";

type LivenessSessionRecord = {
  userId: string;
  expiresAt: number;
  consumed: boolean;
};

type ResultsRequestBody = {
  sessionId?: string;
};

const SESSION_TTL_MS = 10 * 60 * 1000;
const DEFAULT_CONFIDENCE_THRESHOLD = 90;

function getAwsRegion() {
  const region = process.env.AWS_REGION?.trim();
  if (!region) {
    throw new Error("AWS_REGION is not configured.");
  }
  return region;
}

function getConfidenceThreshold() {
  const raw = process.env.AWS_REKOGNITION_LIVENESS_CONFIDENCE_THRESHOLD?.trim();
  if (!raw) {
    return DEFAULT_CONFIDENCE_THRESHOLD;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("AWS_REKOGNITION_LIVENESS_CONFIDENCE_THRESHOLD must be between 0 and 100.");
  }

  return value;
}

function getLivenessStore() {
  const globalStore = globalThis as typeof globalThis & {
    __sktechFaceLivenessSessions?: Map<string, LivenessSessionRecord>;
  };

  if (!globalStore.__sktechFaceLivenessSessions) {
    globalStore.__sktechFaceLivenessSessions = new Map<string, LivenessSessionRecord>();
  }

  const now = Date.now();
  for (const [sessionId, record] of globalStore.__sktechFaceLivenessSessions.entries()) {
    if (record.expiresAt <= now || record.consumed) {
      globalStore.__sktechFaceLivenessSessions.delete(sessionId);
    }
  }

  return globalStore.__sktechFaceLivenessSessions;
}

function imageBase64FromBytes(bytes: Uint8Array | undefined) {
  if (!bytes?.byteLength) {
    throw new Error("AWS did not return a reference image. Please try the liveness check again.");
  }

  return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiRole([Role.OFFICIAL]);
    if (guard.error) {
      return guard.error;
    }

    const body = (await request.json().catch(() => ({}))) as ResultsRequestBody;
    const sessionId = body.sessionId?.trim();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }

    const store = getLivenessStore();
    const sessionRecord = store.get(sessionId);

    if (
      !sessionRecord ||
      sessionRecord.userId !== guard.session.user.id ||
      sessionRecord.expiresAt <= Date.now() ||
      sessionRecord.consumed
    ) {
      return NextResponse.json(
        { error: "Face liveness session expired or does not belong to this account." },
        { status: 403 },
      );
    }

    const rekognition = new RekognitionClient({ region: getAwsRegion() });
    const threshold = getConfidenceThreshold();
    const livenessResult = await rekognition.send(
      new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId }),
    );

    if (livenessResult.Status !== "SUCCEEDED") {
      return NextResponse.json(
        { error: "Liveness check failed. Please try again." },
        { status: 400 },
      );
    }

    if ((livenessResult.Confidence ?? 0) < threshold) {
      return NextResponse.json(
        { error: "Liveness confidence was too low. Please try again in better lighting." },
        { status: 400 },
      );
    }

    const imageBase64 = imageBase64FromBytes(livenessResult.ReferenceImage?.Bytes);
    const aiResponse = await registerFaceEmbeddingFromReferenceImage({
      userId: guard.session.user.id,
      imageBase64,
    });

    await prisma.user.update({
      where: { id: guard.session.user.id },
      data: {
        faceEmbedding: aiResponse.encryptedEmbedding,
        faceRegistered: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "FACE_REGISTERED",
        model: "User",
        recordId: guard.session.user.id,
        userId: guard.session.user.id,
      },
    });

    store.set(sessionId, {
      ...sessionRecord,
      consumed: true,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return NextResponse.json({
      success: true,
      detectedFaces: aiResponse.detectedFaces,
      livenessPassed: true,
      livenessConfidence: livenessResult.Confidence ?? null,
      message: "Face registration completed.",
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("POST /api/face/liveness/results error:", error);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Face registration failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
