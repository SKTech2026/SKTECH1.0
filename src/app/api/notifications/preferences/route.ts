import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireNotificationUser } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

const preferenceFields = [
  "pushChat",
  "pushAnnouncements",
  "pushKkProfile",
  "pushCertificates",
  "pushAdmissions",
  "pushSystem",
] as const;

const defaultPreferences = {
  pushChat: true,
  pushAnnouncements: true,
  pushKkProfile: true,
  pushCertificates: true,
  pushAdmissions: true,
  pushSystem: true,
};

export async function GET() {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
    select: { pushChat: true, pushAnnouncements: true, pushKkProfile: true, pushCertificates: true, pushAdmissions: true, pushSystem: true },
  });
  return NextResponse.json({ preferences: preferences ?? defaultPreferences }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid notification preferences." }, { status: 400 });
  const entries = Object.entries(body);
  if (entries.length === 0 || entries.some(([key, value]) => !preferenceFields.includes(key as typeof preferenceFields[number]) || typeof value !== "boolean")) {
    return NextResponse.json({ error: "Invalid notification preferences." }, { status: 400 });
  }

  const updates = Object.fromEntries(entries) as Partial<typeof defaultPreferences>;
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...updates },
    update: updates,
    select: { pushChat: true, pushAnnouncements: true, pushKkProfile: true, pushCertificates: true, pushAdmissions: true, pushSystem: true },
  });
  return NextResponse.json({ preferences }, { headers: { "Cache-Control": "no-store" } });
}