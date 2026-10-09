import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type NotificationCategory = "System" | "Admission" | "KK Profile" | "Certificate" | "Attendance" | "Announcement" | "Security" | "Chat";

export async function requireNotificationUser(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  return user?.id ?? null;
}

export function safeNotificationHref(href: string | null | undefined): string | null {
  if (!href || href.length > 200 || !/^\/(?:dashboard|mobile)(?:\/[a-zA-Z0-9-]+)*\/?$/.test(href)) return null;
  return href;
}

export async function createNotificationForUser(input: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
  important?: boolean;
}) {
  const notification = await prisma.appNotification.create({
    data: {
      userId: input.userId,
      category: input.category,
      title: input.title.slice(0, 80),
      body: input.body.slice(0, 180),
      href: safeNotificationHref(input.href) ?? "/dashboard",
      important: input.important ?? false,
    },
  });
  return notification;
}
