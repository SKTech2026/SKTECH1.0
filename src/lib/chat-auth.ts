import { AdmissionStatus, OfficialStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type ChatUserContext = {
  userId: string;
  role: Extract<Role, "OFFICIAL" | "STAFF">;
  municipalityId: string;
};

export class ChatAuthError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "ChatAuthError";
    this.status = status;
  }
}

type ChatRecipient = {
  userId: string;
  role: Extract<Role, "OFFICIAL" | "STAFF">;
  municipalityId: string;
  name: string;
  email: string | null;
  officialRole: string | null;
};

export function buildDirectConversationKey(
  municipalityId: string,
  firstUserId: string,
  secondUserId: string,
) {
  const [first, second] = [firstUserId, secondUserId].sort();
  return `${municipalityId}:${first}:${second}`;
}

export async function requireChatUser(): Promise<ChatUserContext> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new ChatAuthError("Unauthorized.", 401);
  }

  if (session.user.status !== UserStatus.APPROVED) {
    throw new ChatAuthError("Account is not approved.", 403);
  }

  if (session.user.role === Role.STAFF) {
    const municipalityId = session.user.municipalityPresidentId;
    if (!municipalityId) {
      throw new ChatAuthError("Staff account is not assigned to a municipality.", 403);
    }

    return {
      userId: session.user.id,
      role: Role.STAFF,
      municipalityId,
    };
  }

  if (session.user.role === Role.OFFICIAL) {
    const official = await prisma.sKOfficial.findUnique({
      where: { userId: session.user.id },
      select: {
        municipalityId: true,
        admissionStatus: true,
        status: true,
      },
    });

    if (
      !official?.municipalityId ||
      official.admissionStatus !== AdmissionStatus.APPROVED ||
      official.status !== OfficialStatus.ACTIVE
    ) {
      throw new ChatAuthError("Official account is not eligible for chat.", 403);
    }

    return {
      userId: session.user.id,
      role: Role.OFFICIAL,
      municipalityId: official.municipalityId,
    };
  }

  throw new ChatAuthError("Chat is only available to SK Officials and Staff.", 403);
}

export async function getEligibleChatContacts(current: ChatUserContext) {
  const officialContacts = await prisma.user.findMany({
    where: {
      id: { not: current.userId },
      role: Role.OFFICIAL,
      status: UserStatus.APPROVED,
      official: {
        municipalityId: current.municipalityId,
        admissionStatus: AdmissionStatus.APPROVED,
        status: OfficialStatus.ACTIVE,
      },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
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
  });

  const staffContacts =
    current.role === Role.OFFICIAL
      ? await prisma.user.findMany({
          where: {
            id: { not: current.userId },
            role: Role.STAFF,
            status: UserStatus.APPROVED,
            municipalityPresidentId: current.municipalityId,
          },
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        })
      : [];

  return [
    ...officialContacts.map((user) => ({
      userId: user.id,
      name:
        user.official?.firstName && user.official.lastName
          ? `${user.official.firstName} ${user.official.lastName}`
          : user.name || user.email || "SK Official",
      email: user.email,
      role: user.role,
      officialRole: user.official?.role ?? null,
      municipality: user.official?.municipality ?? null,
    })),
    ...staffContacts.map((user) => ({
      userId: user.id,
      name: user.name || user.email || "Municipal Staff",
      email: user.email,
      role: user.role,
      officialRole: null,
      municipality: null,
    })),
  ];
}

async function resolveRecipient(userId: string): Promise<ChatRecipient | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      municipalityPresidentId: true,
      official: {
        select: {
          firstName: true,
          lastName: true,
          municipalityId: true,
          admissionStatus: true,
          status: true,
          role: true,
        },
      },
    },
  });

  if (!user || user.status !== UserStatus.APPROVED) {
    return null;
  }

  if (user.role === Role.STAFF && user.municipalityPresidentId) {
    return {
      userId: user.id,
      role: Role.STAFF,
      municipalityId: user.municipalityPresidentId,
      name: user.name || user.email || "Municipal Staff",
      email: user.email,
      officialRole: null,
    };
  }

  if (
    user.role === Role.OFFICIAL &&
    user.official?.municipalityId &&
    user.official.admissionStatus === AdmissionStatus.APPROVED &&
    user.official.status === OfficialStatus.ACTIVE
  ) {
    return {
      userId: user.id,
      role: Role.OFFICIAL,
      municipalityId: user.official.municipalityId,
      name:
        user.official.firstName && user.official.lastName
          ? `${user.official.firstName} ${user.official.lastName}`
          : user.name || user.email || "SK Official",
      email: user.email,
      officialRole: user.official.role,
    };
  }

  return null;
}

export async function requireAllowedChatRecipient(
  current: ChatUserContext,
  recipientUserId: string,
) {
  if (recipientUserId === current.userId) {
    throw new ChatAuthError("Cannot create a chat with yourself.", 400);
  }

  const recipient = await resolveRecipient(recipientUserId);
  if (!recipient) {
    throw new ChatAuthError("Chat recipient is not available.", 403);
  }

  if (recipient.municipalityId !== current.municipalityId) {
    throw new ChatAuthError("Cross-municipality chat is not allowed.", 403);
  }

  const officialToOfficial =
    current.role === Role.OFFICIAL && recipient.role === Role.OFFICIAL;
  const officialToStaff =
    (current.role === Role.OFFICIAL && recipient.role === Role.STAFF) ||
    (current.role === Role.STAFF && recipient.role === Role.OFFICIAL);

  if (!officialToOfficial && !officialToStaff) {
    throw new ChatAuthError("This chat pairing is not allowed in v1.", 403);
  }

  return recipient;
}

export async function requireConversationAccess(
  current: ChatUserContext,
  conversationId: string,
) {
  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      municipalityId: current.municipalityId,
      participants: {
        some: {
          userId: current.userId,
        },
      },
    },
    select: {
      id: true,
      municipalityId: true,
    },
  });

  if (!conversation) {
    throw new ChatAuthError("Conversation not found or not allowed.", 403);
  }

  return conversation;
}
