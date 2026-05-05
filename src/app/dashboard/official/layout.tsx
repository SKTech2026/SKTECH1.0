import type { ReactNode } from "react";

import RoleShell, { RoleShellItem } from "@/components/dashboard/role-shell";

const officialItems: RoleShellItem[] = [
  {
    href: "/dashboard/official",
    label: "Official Briefing",
    description: "Personal overview",
    icon: "layoutDashboard",
  },
  {
    href: "/dashboard/official/admission",
    label: "Admission Details",
    description: "Submit verification profile",
    icon: "userCheck",
  },
  {
    href: "/dashboard/official/profile",
    label: "Profile",
    description: "Edit ID details and photo",
    icon: "userCog",
  },
  {
    href: "/dashboard/official/announcements",
    label: "Announcements",
    description: "Public advisories",
    icon: "megaphone",
  },
  {
    href: "/dashboard/official/digital-id",
    label: "Digital ID",
    description: "View and download card",
    icon: "badgeCheck",
  },
  {
    href: "/dashboard/official/attendance",
    label: "Attendance Logs",
    description: "Your participation trail",
    icon: "clipboardList",
  },
  {
    href: "/dashboard/official/accomplishments",
    label: "Accomplishments",
    description: "Federation milestones",
    icon: "trophy",
  },
  {
    href: "/dashboard/official/settings",
    label: "Settings",
    description: "Theme and account preferences",
    icon: "settings",
  },
];

export default function OfficialDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleShell
      roleLabel="SK Official"
      heading="Official Access Dashboard"
      subheading="Read-only portal for announcements, identity, attendance, and accomplishments."
      items={officialItems}
    >
      {children}
    </RoleShell>
  );
}
