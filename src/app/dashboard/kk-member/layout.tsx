import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";
import RoleShell, { type RoleShellItem } from "@/components/dashboard/role-shell";
import { getKKUser } from "@/lib/kk";

const items: RoleShellItem[] = [
  { href: "/dashboard/kk-member", label: "My dashboard", description: "Profile and YouthPass", icon: "layoutDashboard" },
  { href: "/dashboard/kk-member/profile", label: "KK Survey / Profiling", description: "Complete your registry profile", icon: "clipboardList" },
  { href: "/dashboard/kk-member/youthpass", label: "YouthPass", description: "Your verified digital ID", icon: "badgeCheck" },
  { href: "/dashboard/kk-member/certificates", label: "My Certificates", description: "Digital event achievements", icon: "badgeCheck" },
];

export default async function KKLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireDashboardRole(session, [Role.KK_MEMBER], {
    unauthenticatedRedirect: "/kk/login",
  });

  const member = await getKKUser();
  if (!member) redirect("/kk/login");

  return (
    <RoleShell
      roleLabel="KK Member"
      heading="KK Youth Portal"
      subheading="Your barangay profile and participation"
      items={items}
      account={{ name: authorizedSession.user.name ?? member.email, email: member.email }}
      logoutCallbackUrl="/kk/login"
    >
      {children}
    </RoleShell>
  );
}
