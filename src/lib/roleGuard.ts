import { Role, UserStatus } from "@prisma/client";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

export function isRoleAllowed(
  role: Role | null | undefined,
  allowedRoles: Role[],
): boolean {
  return Boolean(role && allowedRoles.includes(role));
}

export function requireRole(
  session: Session | null,
  allowedRoles: Role[],
  requireApproved = true,
): Session {
  if (!session?.user) {
    redirect("/login");
  }

  if (!isRoleAllowed(session.user.role, allowedRoles)) {
    redirect("/unauthorized");
  }

  if (requireApproved && session.user.status !== UserStatus.APPROVED) {
    redirect("/login?error=account_not_approved");
  }

  return session;
}
