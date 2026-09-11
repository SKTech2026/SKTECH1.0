import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type ApiRoleGuard =
  | {
      session: Session;
      error?: never;
    }
  | {
      session?: never;
      error: NextResponse;
    };

type ApiRoleOptions = {
  requireApproved?: boolean;
};

async function getCurrentApiUser(sessionUserId: string, allowedRoles: Role[]) {
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      role: true,
      status: true,
      municipalityPresidentId: true,
      municipalityOfficerId: true,
    },
  });

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}

export async function requireApiRole(
  allowedRoles: Role[],
  { requireApproved = true }: ApiRoleOptions = {},
): Promise<ApiRoleGuard> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  if (requireApproved && session.user.status !== UserStatus.APPROVED) {
    return {
      error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }),
    };
  }

  const currentUser = await getCurrentApiUser(session.user.id, allowedRoles);
  if (!currentUser) {
    return {
      error: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  const allowedStatuses: UserStatus[] = requireApproved
    ? [UserStatus.APPROVED]
    : [UserStatus.APPROVED, UserStatus.PENDING];

  if (!allowedStatuses.includes(currentUser.status)) {
    return {
      error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }),
    };
  }

  session.user.role = currentUser.role;
  session.user.status = currentUser.status;
  session.user.municipalityPresidentId = currentUser.municipalityPresidentId;
  session.user.municipalityOfficerId = currentUser.municipalityOfficerId;

  return { session };
}
