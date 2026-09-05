import { Role, UserStatus } from "@prisma/client";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

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

const dashboardPathByRole: Record<Role, string> = {
  [Role.ADMIN]: "/dashboard/admin",
  [Role.STAFF]: "/dashboard/staff",
  [Role.OFFICIAL]: "/dashboard/official",
};

type DashboardRoleOptions = {
  unauthenticatedRedirect: string;
  requireApproved?: boolean;
};

export function requireDashboardRole(
  session: Session | null,
  allowedRoles: Role[],
  {
    unauthenticatedRedirect,
    requireApproved = true,
  }: DashboardRoleOptions,
): Session {
  if (!session?.user) {
    redirect(unauthenticatedRedirect);
  }

  if (!isRoleAllowed(session.user.role, allowedRoles)) {
    redirect(dashboardPathByRole[session.user.role] ?? "/unauthorized");
  }

  if (requireApproved && session.user.status !== UserStatus.APPROVED) {
    redirect("/login?error=account_not_approved");
  }

  return session;
}

export async function requireOfficialFeatureAccess(
  session: Session | null,
): Promise<Session> {
  if (!session?.user?.id) {
    redirect("/official/auth");
  }

  if (!isRoleAllowed(session.user.role, [Role.OFFICIAL])) {
    redirect(dashboardPathByRole[session.user.role] ?? "/unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  if (!user || user.status !== UserStatus.APPROVED) {
    redirect("/dashboard/official?access=admission_required");
  }

  return session;
}
