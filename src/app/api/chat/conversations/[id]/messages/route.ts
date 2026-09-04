import { NextRequest, NextResponse } from "next/server";

import {
  ChatAuthError,
  requireChatUser,
  requireConversationAccess,
} from "@/lib/chat-auth";
import { deleteChatAttachmentObject, uploadChatAttachment } from "@/lib/chat-storage";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_TEXT_LENGTH = 5000;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function serializeMessage(message: Awaited<ReturnType<typeof getMessages>>[number]) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt,
    sender: {
      id: message.sender.id,
      name:
        message.sender.official?.firstName && message.sender.official.lastName
          ? `${message.sender.official.firstName} ${message.sender.official.lastName}`
          : message.sender.name || message.sender.email || "SKTech User",
      role: message.sender.role,
    },
    attachments: message.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      downloadUrl: `/api/chat/attachments/${attachment.id}`,
    })),
  };
}

function getMessages(conversationId: string, limit: number) {
  return prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          official: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      attachments: true,
    },
  });
}

async function readMessagePayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const contentValue = formData.get("content");
    const attachmentValue = formData.get("attachment");
    return {
      content: typeof contentValue === "string" ? contentValue.trim() : "",
      attachment:
        attachmentValue instanceof File && attachmentValue.size > 0
          ? attachmentValue
          : null,
    };
  }

  const body = (await request.json().catch(() => ({}))) as { content?: unknown };
  return {
    content: typeof body.content === "string" ? body.content.trim() : "",
    attachment: null,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const current = await requireChatUser();
    const { id } = await context.params;
    await requireConversationAccess(current, id);

    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "50");
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitParam) ? limitParam : 50));
    const messages = await getMessages(id, limit);

    await prisma.chatParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: current.userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        messages: messages.reverse().map(serializeMessage),
      },
      { status: 200 },
    );
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to load messages.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  let createdMessageId: string | null = null;
  let uploadedObjectPath: string | null = null;

  try {
    const current = await requireChatUser();
    const { id } = await context.params;
    const conversation = await requireConversationAccess(current, id);
    const { content, attachment } = await readMessagePayload(request);

    if (!content && !attachment) {
      return NextResponse.json(
        { error: "Message text or attachment is required." },
        { status: 400 },
      );
    }
    if (content.length > MAX_MESSAGE_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Message text must be ${MAX_MESSAGE_TEXT_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: current.userId,
        content: content || null,
      },
    });
    createdMessageId = message.id;

    if (attachment) {
      const uploaded = await uploadChatAttachment(
        attachment,
        current.municipalityId,
        conversation.id,
        message.id,
      );
      uploadedObjectPath = uploaded.objectPath;

      await prisma.chatAttachment.create({
        data: {
          messageId: message.id,
          objectPath: uploaded.objectPath,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
        },
      });
    }

    await prisma.$transaction([
      prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      }),
      prisma.chatParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: current.userId,
          },
        },
        data: { lastReadAt: new Date() },
      }),
    ]);

    const responseMessage = await prisma.chatMessage.findUniqueOrThrow({
      where: { id: message.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            official: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    return NextResponse.json(
      {
        message: serializeMessage(responseMessage),
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedObjectPath) {
      await deleteChatAttachmentObject(uploadedObjectPath).catch(() => null);
    }
    if (createdMessageId) {
      await prisma.chatMessage.delete({ where: { id: createdMessageId } }).catch(() => null);
    }

    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to send message.";
    return NextResponse.json({ error: message }, { status });
  }
}
