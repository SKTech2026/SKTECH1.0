import { AdmissionStatus, OfficialStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export class FeedAuthError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "FeedAuthError";
    this.status = status;
  }
}

export type FeedViewer = {
  userId: string;
  role: Role;
  municipalityId: string | null;
  name: string;
  email: string | null;
};

export async function requireFeedViewer(): Promise<FeedViewer> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new FeedAuthError("Unauthorized.", 401);
  if (session.user.status !== UserStatus.APPROVED) {
    throw new FeedAuthError("Account is not approved.");
  }

  if (session.user.role === Role.ADMIN) {
    return {
      userId: session.user.id,
      role: Role.ADMIN,
      municipalityId: null,
      name: session.user.name ?? session.user.email ?? "SKTECH Admin",
      email: session.user.email ?? null,
    };
  }

  if (session.user.role === Role.STAFF) {
    if (!session.user.municipalityPresidentId) {
      throw new FeedAuthError("Staff account is not assigned to a municipality.");
    }
    return {
      userId: session.user.id,
      role: Role.STAFF,
      municipalityId: session.user.municipalityPresidentId,
      name: session.user.name ?? session.user.email ?? "Municipal Staff",
      email: session.user.email ?? null,
    };
  }

  if (session.user.role === Role.OFFICIAL) {
    const official = await prisma.sKOfficial.findUnique({
      where: { userId: session.user.id },
      select: {
        municipalityId: true,
        admissionStatus: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });
    if (
      !official?.municipalityId ||
      official.admissionStatus !== AdmissionStatus.APPROVED ||
      official.status !== OfficialStatus.ACTIVE
    ) {
      throw new FeedAuthError("Official account is not eligible for the feed.");
    }
    return {
      userId: session.user.id,
      role: Role.OFFICIAL,
      municipalityId: official.municipalityId,
      name: `${official.firstName} ${official.lastName}`.trim(),
      email: session.user.email ?? null,
    };
  }

  throw new FeedAuthError("This account cannot access the feed.");
}

export function canViewFeedPost(viewer: FeedViewer, municipalityId: string | null) {
  return viewer.role === Role.ADMIN || municipalityId === null || municipalityId === viewer.municipalityId;
}

export function canManageFeedPost(viewer: FeedViewer, authorId: string) {
  return viewer.role === Role.ADMIN || (viewer.role === Role.STAFF && viewer.userId === authorId);
}
