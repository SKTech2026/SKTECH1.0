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
    description: "Daily monitoring view",
    icon: "layoutDashboard",
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

export default async function StaffDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  requireDashboardRole(session, [Role.STAFF], {
    unauthenticatedRedirect: "/login?role=STAFF",
  });

  return (
    <RoleShell
      roleLabel="Staff Operations"
      heading="Provincial Staff Dashboard"
      subheading="Review admissions, monitor attendance, and publish public information."
      items={staffItems}
    >
      {children}
    </RoleShell>
  );
}
