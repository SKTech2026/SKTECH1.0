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
    href: "/dashboard/admin/system-health",
    label: "System Health",
    description: "Production monitoring",
    icon: "activity",
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
    href: "/dashboard/admin/archive",
    label: "Archive Bin",
    description: "Review terminated records",
    icon: "archive",
  },
  {
    href: "/dashboard/admin/analytics",
    label: "Overall Analytics",
    description: "Charts and performance",
    icon: "barChart3",
  },
  {
    href: "/dashboard/admin/kk-analytics",
    label: "KK Analytics",
    description: "Province-wide youth reporting",
    icon: "barChart3",
  },
  {
    href: "/dashboard/admin/compliance",
    label: "Compliance Dashboard",
    description: "Reports and operational indicators",
    icon: "barChart3",
  },
  {
    href: "/dashboard/admin/audit-trail",
    label: "Audit Trail",
    description: "Accountability and recorded actions",
    icon: "shieldCheck",
  },
  {
    href: "/dashboard/admin/events",
    label: "Event Management",
    description: "Configure provincial events",
    icon: "calendarDays",
  },
  {
    href: "/dashboard/admin/feed",
    label: "Internal Feed",
    description: "Admin and Staff updates",
    icon: "messageSquare",
  },
  {
    href: "/dashboard/admin/public-news",
    label: "Public News Feed",
    description: "Publish landing updates",
    icon: "megaphone",
  },
  {
    href: "/dashboard/admin/id-production",
    label: "ID Production",
    description: "Generate official IDs",
    icon: "badgeCheck",
  },
  {
    href: "/dashboard/admin/id-template",
    label: "ID Template Designer",
    description: "Design official ID layout",
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

const desktopItems: RoleShellItem[] = [
  { href: "/dashboard/admin", label: "Dashboard", description: "System overview", icon: "layoutDashboard" },
  { href: "/dashboard/admin/analytics", label: "Overall Analytics", description: "Reports and insights", icon: "barChart3", activePaths: ["/dashboard/admin/kk-analytics"] },
  { href: "/dashboard/admin/user-access", label: "User & Access Management", description: "Staff and municipalities", icon: "userCog", activePaths: ["/dashboard/admin/staff-admission", "/dashboard/admin/staff-access", "/dashboard/admin/municipalities", "/dashboard/admin/archive"] },
  { href: "/dashboard/admin/profiling", label: "SK Profiling", description: "Official records", icon: "users" },
  { href: "/dashboard/admin/id-management", label: "ID Management", description: "Production and scanning", icon: "badgeCheck", activePaths: ["/dashboard/admin/id-production", "/dashboard/admin/id-template", "/dashboard/admin/id-scanning"] },
  { href: "/dashboard/admin/events-attendance", label: "Events & Attendance", description: "Events and feeds", icon: "calendarDays", activePaths: ["/dashboard/admin/events", "/dashboard/admin/feed", "/dashboard/admin/public-news"] },
  { href: "/dashboard/admin/compliance", label: "Compliance & Reports", description: "Compliance monitoring", icon: "clipboardList" },
  { href: "/dashboard/admin/system-security", label: "System & Security", description: "Health and audit trail", icon: "shieldCheck", activePaths: ["/dashboard/admin/system-health", "/dashboard/admin/audit-trail"] },
  { href: "/dashboard/admin/settings", label: "Settings", description: "Theme and account", icon: "settings" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireDashboardRole(session, [Role.ADMIN], {
    unauthenticatedRedirect: "/login?role=ADMIN",
  });

  return (
    <RoleShell
      roleLabel="Administrator"
      heading="Provincial Admin Dashboard"
      subheading="Administrative workspace for governance, identity, and attendance oversight."
      items={adminItems}
      desktopItems={desktopItems}
      variant="adminCn"
      assistantRole="ADMIN"
      account={{
        name: authorizedSession.user.name,
        email: authorizedSession.user.email,
      }}
    >
      {children}
    </RoleShell>
  );
}
