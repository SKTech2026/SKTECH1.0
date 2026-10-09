import webpush from "web-push";

import { prisma } from "@/lib/db";

export type PushNotificationKind = "announcement" | "chat" | "kkProfile" | "certificate" | "admission" | "system" | "security" | "update";

const preferenceByKind = {
  announcement: "pushAnnouncements",
  chat: "pushChat",
  kkProfile: "pushKkProfile",
  certificate: "pushCertificates",
  admission: "pushAdmissions",
  system: "pushSystem",
  update: "pushSystem",
} as const;

const SAFE_PUSH_PATHS = new Set([
  "/",
  "/dashboard",
  "/dashboard/staff/announcements",
  "/dashboard/official/announcements",
  "/dashboard/staff/chat",
  "/dashboard/official/chat",
]);

function safePushPath(value: string): string {
  return SAFE_PUSH_PATHS.has(value) ? value : "/dashboard";
}

export function getPushConfig() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export async function sendPushToUser(
  userId: string,
  notification: { kind: PushNotificationKind; href: string } = { kind: "update", href: "/dashboard" },
) {
  const config = getPushConfig();
  if (!config) return { sent: 0, configured: false };
  if (notification.kind !== "security") {
    const preferenceField = preferenceByKind[notification.kind as keyof typeof preferenceByKind];
    const preference = await prisma.notificationPreference.findUnique({
      where: { userId },
      select: { pushChat: true, pushAnnouncements: true, pushKkProfile: true, pushCertificates: true, pushAdmissions: true, pushSystem: true },
    });
    if (preference && !preference[preferenceField]) return { sent: 0, configured: true, skipped: "preference" };
  }
  const payload = JSON.stringify({ kind: notification.kind, url: safePushPath(notification.href) });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, revokedAt: null },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
    take: 20,
  });
  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload,
        { TTL: 60, vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey } },
      );
      return true;
    } catch (error) {
      if (typeof error === "object" && error && "statusCode" in error && (error.statusCode === 404 || error.statusCode === 410)) {
        await prisma.pushSubscription.update({ where: { id: subscription.id }, data: { revokedAt: new Date() } });
      }
      return false;
    }
  }));
  return { sent: results.filter((result) => result.status === "fulfilled" && result.value).length, configured: true };
}
