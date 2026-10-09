import { AdmissionStatus, OfficialStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPushToUser, type PushNotificationKind } from "@/lib/notifications/push";

export type NotificationCategory = "System" | "Admission" | "KK Profile" | "Certificate" | "Attendance" | "Announcement" | "Security" | "Chat";
export type NotificationRecipient = { userId: string; href: string };

export async function requireNotificationUser(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  return user?.id ?? null;
}

export function safeNotificationHref(href: string | null | undefined): string | null {
  if (href === "/") return href;
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
  dedupeKey?: string;
  push?: { kind: PushNotificationKind; href: string };
}) {
  let notification;
  try {
    notification = await prisma.appNotification.create({
      data: {
        userId: input.userId,
        category: input.category,
        title: input.title.slice(0, 80),
        body: input.body.slice(0, 180),
        href: safeNotificationHref(input.href) ?? "/dashboard",
        important: input.important ?? false,
        dedupeKey: input.dedupeKey,
      },
    });
  } catch (error) {
    if (input.dedupeKey && isUniqueConstraintError(error)) return null;
    throw error;
  }

  if (input.push) {
    await sendPushToUser(input.userId, input.push).catch(() => ({ sent: 0, configured: false }));
  }
  return notification;
}

export async function createNotificationsForUsers(input: {
  recipients: NotificationRecipient[];
  excludeUserIds?: string[];
  category: NotificationCategory;
  title: string;
  body: string;
  important?: boolean;
  dedupeKeyPrefix: string;
  pushKind?: PushNotificationKind;
}) {
  const excluded = new Set(input.excludeUserIds ?? []);
  const recipients = [...new Map(input.recipients
    .filter((recipient) => !excluded.has(recipient.userId))
    .map((recipient) => [recipient.userId, recipient])).values()];
  let created = 0;

  for (let offset = 0; offset < recipients.length; offset += 25) {
    const batch = recipients.slice(offset, offset + 25);
    const results = await Promise.all(batch.map(async (recipient) => {
      try {
        const notification = await createNotificationForUser({
          userId: recipient.userId,
          category: input.category,
          title: input.title,
          body: input.body,
          href: recipient.href,
          important: input.important,
          dedupeKey: `${input.dedupeKeyPrefix}:${recipient.userId}`,
          push: input.pushKind ? { kind: input.pushKind, href: recipient.href } : undefined,
        });
        return notification ? 1 : 0;
      } catch {
        return 0;
      }
    }));
    created += results.reduce<number>((total, result) => total + result, 0);
  }

  return { created, recipients: recipients.length };
}

export async function notifyPublicNewsRecipients(postId: string, authorId: string) {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: authorId },
        status: UserStatus.APPROVED,
        OR: [
          { role: { in: [Role.ADMIN, Role.STAFF, Role.KK_MEMBER] } },
          { role: Role.OFFICIAL, official: { is: { admissionStatus: AdmissionStatus.APPROVED, status: OfficialStatus.ACTIVE } } },
        ],
      },
      select: { id: true },
    });
    await createNotificationsForUsers({
      recipients: users.map(({ id }) => ({ userId: id, href: "/" })),
      excludeUserIds: [authorId],
      category: "Announcement",
      title: "New announcement",
      body: "A new SKTECH announcement is available.",
      important: true,
      dedupeKeyPrefix: `public-news:${postId}`,
      pushKind: "announcement",
    });
  } catch (notificationError) {
    if (process.env.NODE_ENV !== "production") console.error("Public news notification delivery failed:", notificationError);
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
