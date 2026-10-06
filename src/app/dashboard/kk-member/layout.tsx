import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import RoleShell, { type RoleShellItem } from "@/components/dashboard/role-shell";
import { getKKUser } from "@/lib/kk";

const items: RoleShellItem[] = [
  { href: "/dashboard/kk-member", label: "My dashboard", description: "Profile and YouthPass", icon: "layoutDashboard" },
  { href: "/dashboard/kk-member/profile", label: "KK Survey / Profiling", description: "Complete your registry profile", icon: "clipboardList" },
];

export default async function KKLayout({ children }: { children: ReactNode }) {
  const member = await getKKUser();
  if (!member) redirect("/kk/login");
  return <RoleShell roleLabel="KK Member" heading="KK Youth Portal" subheading="Your barangay profile and participation" items={items} account={{ name: member.email, email: member.email }} logoutCallbackUrl="/kk/login">{children}</RoleShell>;
}
