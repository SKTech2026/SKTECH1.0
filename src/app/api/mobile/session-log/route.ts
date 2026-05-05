import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



type SessionLogBody = {
  action?: string;
  model?: string;
  recordId?: string;
};

const ALLOWED_ROLES = new Set<Role>([Role.ADMIN, Role.STAFF, Role.OFFICIAL]);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role || !ALLOWED_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.status !== UserStatus.APPROVED) {
      return NextResponse.json({ error: "Account is not approved." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as SessionLogBody;
    const action = body.action?.trim() || "MOBILE_SESSION_EVENT";

    await prisma.auditLog.create({
      data: {
        action,
        model: body.model?.trim() || "MobileSession",
        recordId: body.recordId?.trim() || "mobile",
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/mobile/session-log error:", error);
    return NextResponse.json({ error: "Failed to save mobile session log." }, { status: 500 });
  }
}



