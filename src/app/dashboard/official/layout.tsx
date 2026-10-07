import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";
import RoleShell, { RoleShellItem } from "@/components/dashboard/role-shell";
import { getChairScope } from "@/lib/kk";

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
    href: "/dashboard/official/feed",
    label: "Municipal SK Federation Feed",
    description: "Staff posts for your municipality",
    icon: "megaphone",
  },
  {
    href: "/dashboard/official/chat",
    label: "Chat",
    description: "Municipality messages",
    icon: "messageSquare",
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

const desktopItems: RoleShellItem[] = [
  { href: "/dashboard/official", label: "Dashboard", description: "Official briefing", icon: "layoutDashboard" },
  { href: "/dashboard/official/services", label: "Official Services", description: "Profile and identity", icon: "badgeCheck", activePaths: ["/dashboard/official/admission", "/dashboard/official/profile", "/dashboard/official/digital-id", "/dashboard/official/chat", "/dashboard/official/facial-registration"] },
  { href: "/dashboard/official/events-attendance", label: "Events & Attendance", description: "Participation", icon: "calendarDays", activePaths: ["/dashboard/official/attendance", "/dashboard/official/accomplishments"] },
  { href: "/dashboard/official/analytics", label: "Analytics & Reports", description: "Barangay insights", icon: "barChart3", activePaths: ["/dashboard/official/kk-analytics"] },
  { href: "/dashboard/official/announcements", label: "Announcements", description: "Public advisories", icon: "megaphone", activePaths: ["/dashboard/official/feed"] },
  { href: "/dashboard/official/settings", label: "Settings", description: "Theme and account", icon: "settings" },
];

export default async function OfficialDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireDashboardRole(session, [Role.OFFICIAL], {
    unauthenticatedRedirect: "/official/auth",
    requireApproved: false,
  });
  const chairScope = await getChairScope();

  return (
    <RoleShell
      roleLabel="SK Official"
      heading="Official Access Dashboard"
      subheading="Read-only portal for announcements, identity, attendance, and accomplishments."
      items={chairScope ? [...officialItems, { href: "/dashboard/official/kk-registry", label: "KK Registry", description: "Barangay youth profiles", icon: "users" }, { href: "/dashboard/official/kk-analytics", label: "KK Analytics", description: "Barangay youth reporting", icon: "barChart3" }] : officialItems}
      desktopItems={chairScope ? [desktopItems[0], desktopItems[1], { href: "/dashboard/official/kk-management", label: "KK Management", description: "Registry and reviews", icon: "users", activePaths: ["/dashboard/official/kk-registry"] }, ...desktopItems.slice(2)] : desktopItems}
      logoutCallbackUrl="/official/auth"
      variant="officialCn"
      assistantRole="OFFICIAL"
      account={{
        name: authorizedSession.user.name,
        email: authorizedSession.user.email,
      }}
    >
      {children}
    </RoleShell>
  );
}
