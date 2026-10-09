import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getPushConfig } from "@/lib/notifications/push";
import { requireNotificationUser } from "@/lib/notifications/server";

export const runtime = "nodejs";

function validEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" || host === "web.push.apple.com" || host.endsWith(".notify.windows.com"));
  } catch { return false; }
}

export async function GET() {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const config = getPushConfig();
  return NextResponse.json({ configured: Boolean(config), publicKey: config?.publicKey ?? null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!getPushConfig()) return NextResponse.json({ error: "Push notifications are not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const keyPattern = /^[A-Za-z0-9_-]{16,255}$/;
  if (!validEndpoint(body?.endpoint) || typeof body?.keys?.p256dh !== "string" || !keyPattern.test(body.keys.p256dh) || typeof body.keys.auth !== "string" || !keyPattern.test(body.keys.auth)) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: body.endpoint } });
  if (existing && existing.userId !== userId) return NextResponse.json({ error: "Subscription belongs to another account." }, { status: 409 });
  if (existing) {
    await prisma.pushSubscription.update({ where: { id: existing.id }, data: { p256dh: body.keys.p256dh, auth: body.keys.auth, revokedAt: null } });
  } else {
    await prisma.pushSubscription.create({ data: { userId, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth, userAgent: request.headers.get("user-agent")?.slice(0, 255) ?? null } });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
