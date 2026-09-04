import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  buildDirectConversationKey,
  ChatAuthError,
  requireAllowedChatRecipient,
  requireChatUser,
} from "@/lib/chat-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function displayUserName(participant: {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: Role;
    official: {
      firstName: string;
      lastName: string;
      role: string;
      municipality: string | null;
    } | null;
  };
}) {
  const official = participant.user.official;
  if (official) {
    return `${official.firstName} ${official.lastName}`.trim();
  }
  return participant.user.name || participant.user.email || "Municipal Staff";
}

function serializeConversation(
  conversation: Awaited<ReturnType<typeof getUserConversations>>[number],
  currentUserId: string,
) {
  const currentParticipant = conversation.participants.find(
    (participant) => participant.userId === currentUserId,
  );
  const otherParticipant =
    conversation.participants.find((participant) => participant.userId !== currentUserId) ??
    conversation.participants[0];
  const latestMessage = conversation.messages[0] ?? null;
  const unread =
    Boolean(latestMessage) &&
    latestMessage?.senderId !== currentUserId &&
    (!currentParticipant?.lastReadAt ||
      latestMessage.createdAt > currentParticipant.lastReadAt);

  return {
    id: conversation.id,
    municipalityId: conversation.municipalityId,
    updatedAt: conversation.updatedAt,
    unread,
    otherParticipant: otherParticipant
      ? {
          userId: otherParticipant.user.id,
          name: displayUserName(otherParticipant),
          email: otherParticipant.user.email,
          role: otherParticipant.user.role,
          officialRole: otherParticipant.user.official?.role ?? null,
          municipality: otherParticipant.user.official?.municipality ?? null,
        }
      : null,
    latestMessage: latestMessage
      ? {
          id: latestMessage.id,
          senderId: latestMessage.senderId,
          content: latestMessage.content,
          createdAt: latestMessage.createdAt,
          attachmentCount: latestMessage.attachments.length,
        }
      : null,
  };
}

function getUserConversations(userId: string, municipalityId: string) {
  return prisma.chatConversation.findMany({
    where: {
      municipalityId,
      participants: {
        some: {
          userId,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              official: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                  municipality: true,
                },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          attachments: true,
        },
      },
    },
  });
}

export async function GET() {
  try {
    const current = await requireChatUser();
    const conversations = await getUserConversations(
      current.userId,
      current.municipalityId,
    );

    return NextResponse.json(
      {
        conversations: conversations.map((conversation) =>
          serializeConversation(conversation, current.userId),
        ),
      },
      { status: 200 },
    );
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to load conversations.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const current = await requireChatUser();
    const body = (await request.json()) as { recipientUserId?: unknown };
    const recipientUserId =
      typeof body.recipientUserId === "string" ? body.recipientUserId.trim() : "";
    if (!recipientUserId) {
      return NextResponse.json({ error: "recipientUserId is required." }, { status: 400 });
    }

    const recipient = await requireAllowedChatRecipient(current, recipientUserId);
    const directKey = buildDirectConversationKey(
      current.municipalityId,
      current.userId,
      recipient.userId,
    );

    const conversation = await prisma.chatConversation.upsert({
      where: { directKey },
      update: {},
      create: {
        municipalityId: current.municipalityId,
        directKey,
        participants: {
          create: [
            {
              userId: current.userId,
              lastReadAt: new Date(),
            },
            {
              userId: recipient.userId,
            },
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json({ conversationId: conversation.id }, { status: 200 });
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to open conversation.";
    return NextResponse.json({ error: message }, { status });
  }
}
