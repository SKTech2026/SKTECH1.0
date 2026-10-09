import { NextResponse } from "next/server";

import { getPushConfig, sendPushToUser } from "@/lib/notifications/push";
import { createNotificationForUser, requireNotificationUser } from "@/lib/notifications/server";

export const runtime = "nodejs";

const lastTest = new Map<string, number>();

export async function POST() {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!getPushConfig()) return NextResponse.json({ error: "Push notifications are not configured." }, { status: 503 });
  const now = Date.now();
  if (now - (lastTest.get(userId) ?? 0) < 60_000) return NextResponse.json({ error: "Please wait before testing again." }, { status: 429 });
  lastTest.set(userId, now);
  await createNotificationForUser({ userId, category: "System", title: "SKTECH Notification", body: "You have a new update in SKTECH.", href: "/dashboard", important: true });
  const result = await sendPushToUser(userId);
  return NextResponse.json({ ok: true, sent: result.sent }, { headers: { "Cache-Control": "no-store" } });
}
