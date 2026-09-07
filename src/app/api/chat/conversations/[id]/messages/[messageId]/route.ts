import { NextRequest, NextResponse } from "next/server";

import {
  ChatAuthError,
  requireChatUser,
  requireConversationAccess,
} from "@/lib/chat-auth";
import { prisma } from "@/lib/db";
import { deleteChatAttachmentObject } from "@/lib/chat-storage";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_TEXT_LENGTH = 5000;

type RouteContext = {
  params: Promise<{ id: string; messageId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const current = await requireChatUser();
    const { id, messageId } = await context.params;
    await requireConversationAccess(current, id);
    const body = (await request.json().catch(() => ({}))) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content || content.length > MAX_MESSAGE_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Edited text must be 1-${MAX_MESSAGE_TEXT_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const message = await prisma.chatMessage.findFirst({
      where: { id: messageId, conversationId: id, senderId: current.userId, unsentAt: null },
      select: { id: true },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found or not editable." }, { status: 404 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id: message.id },
      data: { content, editedAt: new Date() },
      select: { id: true, content: true, editedAt: true },
    });

    return NextResponse.json({ message: updated }, { status: 200 });
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to edit message.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const current = await requireChatUser();
    const { id, messageId } = await context.params;
    await requireConversationAccess(current, id);
    const action = request.nextUrl.searchParams.get("action") ?? "unsend";

    if (action === "delete") {
      return NextResponse.json(
        { error: "Per-user message deletion is not available yet; use Unsend to remove it for everyone." },
        { status: 400 },
      );
    }
    if (action !== "unsend") {
      return NextResponse.json({ error: "Unsupported message action." }, { status: 400 });
    }

    const message = await prisma.chatMessage.findFirst({
      where: { id: messageId, conversationId: id, senderId: current.userId, unsentAt: null },
      select: { id: true },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found or not yours." }, { status: 404 });
    }

    const attachments = await prisma.chatAttachment.findMany({
      where: { messageId: message.id },
      select: { objectPath: true },
    });

    await prisma.$transaction([
      prisma.chatAttachment.deleteMany({ where: { messageId: message.id } }),
      prisma.chatMessage.update({
        where: { id: message.id },
        data: { content: null, unsentAt: new Date() },
      }),
    ]);
    await Promise.all(attachments.map((attachment) => deleteChatAttachmentObject(attachment.objectPath).catch(() => null)));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to unsend message.";
    return NextResponse.json({ error: message }, { status });
  }
}
