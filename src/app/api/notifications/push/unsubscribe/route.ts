import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireNotificationUser } from "@/lib/notifications/server";

export async function DELETE(request: Request) {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string" || body.endpoint.length > 2048) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }
  await prisma.pushSubscription.updateMany({ where: { userId, endpoint: body.endpoint }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
