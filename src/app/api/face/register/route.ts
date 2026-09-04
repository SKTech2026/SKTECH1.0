import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { registerFaceEmbedding } from "@/lib/face-ai";

export const dynamic = "force-dynamic";



interface RegisterFaceRequestBody {
  imageBase64?: string;
  livenessFrames?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiRole([Role.OFFICIAL], { requireApproved: false });
    if (guard.error) {
      return guard.error;
    }

    const body = (await request.json()) as RegisterFaceRequestBody;
    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return NextResponse.json({ error: "imageBase64 is required." }, { status: 400 });
    }

    const livenessFrames = Array.isArray(body.livenessFrames)
      ? body.livenessFrames.filter((frame) => typeof frame === "string")
      : [];

    const aiResponse = await registerFaceEmbedding({
      userId: guard.session.user.id,
      imageBase64: body.imageBase64,
      livenessFrames,
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

    return NextResponse.json(
      {
        success: true,
        detectedFaces: aiResponse.detectedFaces,
        livenessPassed: aiResponse.livenessPassed,
        message: "Face registration completed.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/face/register error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Face registration failed.",
      },
      { status: 500 },
    );
  }
}




