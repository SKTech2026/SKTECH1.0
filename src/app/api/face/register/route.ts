import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { registerFaceEmbedding } from "@/lib/face-ai";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";



interface RegisterFaceRequestBody {
  imageBase64?: string;
  livenessFrames?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authorized = requireRole(session, [Role.OFFICIAL], false);

    const body = (await request.json()) as RegisterFaceRequestBody;
    if (!body.imageBase64 || typeof body.imageBase64 !== "string") {
      return NextResponse.json({ error: "imageBase64 is required." }, { status: 400 });
    }

    const livenessFrames = Array.isArray(body.livenessFrames)
      ? body.livenessFrames.filter((frame) => typeof frame === "string")
      : [];

    const aiResponse = await registerFaceEmbedding({
      userId: authorized.user.id,
      imageBase64: body.imageBase64,
      livenessFrames,
    });

    await prisma.user.update({
      where: { id: authorized.user.id },
      data: {
        faceEmbedding: aiResponse.encryptedEmbedding,
        faceRegistered: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "FACE_REGISTERED",
        model: "User",
        recordId: authorized.user.id,
        userId: authorized.user.id,
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




