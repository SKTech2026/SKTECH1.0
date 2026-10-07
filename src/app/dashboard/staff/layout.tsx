import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";
import RoleShell, { RoleShellItem } from "@/components/dashboard/role-shell";

const staffItems: RoleShellItem[] = [
  {
    href: "/dashboard/staff",
    label: "Operations Hub",
    description: "Municipal command center",
    icon: "layoutDashboard",
  },
  {
    href: "/dashboard/staff/kk-analytics",
    label: "KK Analytics",
    description: "Municipality youth reporting",
    icon: "barChart3",
  },
  {
    href: "/dashboard/staff/admissions",
    label: "Digital ID Admission",
    description: "Approve official joiners",
    icon: "userCheck",
  },
  {
    href: "/dashboard/staff/attendance-monitoring",
    label: "Attendance Monitor",
    description: "Live scanning and logs",
    icon: "activity",
  },
  {
    href: "/dashboard/staff/announcements",
    label: "Announcements",
    description: "Public bulletin feed",
    icon: "megaphone",
  },
  {
    href: "/dashboard/staff/chat",
    label: "Chat",
    description: "Municipality messages",
    icon: "messageSquare",
  },
  {
    href: "/dashboard/staff/profiling",
    label: "SK Profiling",
    description: "Manage official records",
    icon: "users",
  },
  {
    href: "/dashboard/staff/events",
    label: "Events",
    description: "Schedule and updates",
    icon: "calendarDays",
  },
  {
    href: "/dashboard/staff/id-scanning",
    label: "ID Scanning",
    description: "QR attendance control",
    icon: "scanLine",
  },
  {
    href: "/dashboard/staff/event-kiosk",
    label: "Event Kiosk",
    description: "Face attendance station",
    icon: "scanLine",
  },
  {
    href: "/dashboard/staff/settings",
    label: "Settings",
    description: "Theme and account preferences",
    icon: "settings",
  },
];

const desktopItems: RoleShellItem[] = [
  { href: "/dashboard/staff", label: "Dashboard", description: "Municipal overview", icon: "layoutDashboard" },
  { href: "/dashboard/staff/operations", label: "Staff Operations", description: "Daily workspaces", icon: "userCog", activePaths: ["/dashboard/staff/chat"] },
  { href: "/dashboard/staff/admissions-profiles", label: "Admissions & Profiles", description: "Official records", icon: "userCheck", activePaths: ["/dashboard/staff/admissions", "/dashboard/staff/digital-admission", "/dashboard/staff/profiling"] },
  { href: "/dashboard/staff/events-attendance", label: "Events & Attendance", description: "Events and scanning", icon: "calendarDays", activePaths: ["/dashboard/staff/events", "/dashboard/staff/attendance-monitoring", "/dashboard/staff/id-scanning", "/dashboard/staff/event-kiosk"] },
  { href: "/dashboard/staff/analytics", label: "Analytics & Reports", description: "Municipal insights", icon: "barChart3", activePaths: ["/dashboard/staff/kk-analytics"] },
  { href: "/dashboard/staff/announcements", label: "Announcements", description: "Public bulletin", icon: "megaphone" },
  { href: "/dashboard/staff/settings", label: "Settings", description: "Theme and account", icon: "settings" },
];

export default async function StaffDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireDashboardRole(session, [Role.STAFF], {
    unauthenticatedRedirect: "/login?role=STAFF",
  });

  return (
    <RoleShell
      roleLabel="Staff Operations"
      heading="Municipal Staff Dashboard"
      subheading="Coordinate municipal admissions, attendance, events, and public communications."
      items={staffItems}
      desktopItems={desktopItems}
      variant="staffCn"
      assistantRole="STAFF"
      account={{
        name: authorizedSession.user.name,
        email: authorizedSession.user.email,
      }}
    >
      {children}
    </RoleShell>
  );
}
