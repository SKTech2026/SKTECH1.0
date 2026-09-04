import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

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

  return { session };
}
