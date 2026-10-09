import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireNotificationUser, safeNotificationHref } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const session = await getServerSession(authOptions);

  const notifications = await prisma.appNotification.findMany({
    where: { userId, category: { not: "Chat" } }, orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, category: true, title: true, body: true, href: true, important: true, readAt: true, createdAt: true },
  });
  const items = notifications.map((notification) => ({
    ...notification,
    href: safeNotificationHref(notification.href),
    unread: !notification.readAt,
  }));

  if (session?.user?.role === "OFFICIAL" || session?.user?.role === "STAFF") {
    const participants = await prisma.chatParticipant.findMany({
      where: { userId },
      include: { conversation: { include: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, createdAt: true } } } } },
      take: 30,
    });
    const chatHref = session.user.role === "OFFICIAL" ? "/dashboard/official/chat" : "/dashboard/staff/chat";
    for (const participant of participants) {
      const latest = participant.conversation.messages[0];
      if (!latest || latest.senderId === userId) continue;
      items.push({
        id: `chat:${participant.conversationId}`,
        category: "Chat",
        title: "New chat activity",
        body: "Open your SKTECH chats to view the message.",
        href: chatHref,
        important: false,
        readAt: participant.lastReadAt,
        createdAt: latest.createdAt,
        unread: !participant.lastReadAt || latest.createdAt > participant.lastReadAt,
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ notifications: items.slice(0, 50) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const userId = await requireNotificationUser();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: unknown; all?: unknown } | null;
  if (!body || (body.all !== true && (typeof body.id !== "string" || body.id.length > 100))) {
    return NextResponse.json({ error: "Invalid notification selection." }, { status: 400 });
  }

  if (body.all === true) {
    await Promise.all([
      prisma.appNotification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } }),
      prisma.chatParticipant.updateMany({ where: { userId }, data: { lastReadAt: new Date() } }),
    ]);
  } else if (typeof body.id === "string" && body.id.startsWith("chat:")) {
    const conversationId = body.id.slice(5);
    const readAt = new Date();
    await Promise.all([
      prisma.chatParticipant.updateMany({ where: { userId, conversationId }, data: { lastReadAt: readAt } }),
      prisma.appNotification.updateMany({
        where: { userId, category: "Chat", dedupeKey: { startsWith: `chat:${conversationId}:` }, readAt: null },
        data: { readAt },
      }),
    ]);
  } else {
    await prisma.appNotification.updateMany({ where: { id: body.id as string, userId }, data: { readAt: new Date() } });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
