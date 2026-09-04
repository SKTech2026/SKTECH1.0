import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";
import RoleShell, { RoleShellItem } from "@/components/dashboard/role-shell";

const adminItems: RoleShellItem[] = [
  {
    href: "/dashboard/admin",
    label: "System Overview",
    description: "Provincial administration",
    icon: "layoutDashboard",
  },
  {
    href: "/dashboard/admin/profiling",
    label: "SK Profiling",
    description: "Full official CRUD",
    icon: "users",
  },
  {
    href: "/dashboard/admin/staff-admission",
    label: "Staff Admission",
    description: "Create and edit staff accounts",
    icon: "userCog",
  },
  {
    href: "/dashboard/admin/municipalities",
    label: "Municipalities",
    description: "Assign municipal presidents",
    icon: "clipboardList",
  },
  {
    href: "/dashboard/admin/staff-access",
    label: "Staff Access",
    description: "Toggle staff status",
    icon: "userCog",
  },
  {
    href: "/dashboard/admin/analytics",
    label: "Overall Analytics",
    description: "Charts and performance",
    icon: "barChart3",
  },
  {
    href: "/dashboard/admin/events",
    label: "Event Management",
    description: "Configure provincial events",
    icon: "calendarDays",
  },
  {
    href: "/dashboard/admin/id-production",
    label: "ID Production",
    description: "Generate official IDs",
    icon: "badgeCheck",
  },
  {
    href: "/dashboard/admin/id-scanning",
    label: "ID Scanning",
    description: "Attendance verification",
    icon: "scanLine",
  },
  {
    href: "/dashboard/admin/settings",
    label: "Settings",
    description: "Theme and account preferences",
    icon: "settings",
  },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  requireDashboardRole(session, [Role.ADMIN], {
    unauthenticatedRedirect: "/login?role=ADMIN",
  });

  return (
    <RoleShell
      roleLabel="Administrator"
      heading="Provincial Admin Dashboard"
      subheading="Administrative workspace for governance, identity, and attendance oversight."
      items={adminItems}
      variant="adminCn"
    >
      {children}
    </RoleShell>
  );
}
