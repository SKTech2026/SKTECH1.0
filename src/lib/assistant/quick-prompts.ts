import { SKTECH_ROLE_HELP, type DashboardRole } from "@/lib/assistant/sktech-help";

const pagePrompts: Record<DashboardRole, Record<string, string[]>> = {
  ADMIN: {
    "/dashboard/admin": ["Explain my admin dashboard", "What should I check first?", "Where can I monitor the system?"],
    "/dashboard/admin/kk-analytics": ["Explain these KK analytics", "How do I export this report?", "What does this chart mean?"],
    "/dashboard/admin/compliance": ["How do I review compliance?", "How do I generate reports?", "What needs attention?"],
    "/dashboard/admin/system-health": ["Explain system health", "What does this warning mean?", "What should I check?"],
    "/dashboard/admin/audit-trail": ["How do I review audit logs?", "What actions are tracked?", "How do I investigate activity?"],
  },
  STAFF: {
    "/dashboard/staff": ["Explain my staff dashboard", "What can I manage?", "What should I review today?"],
    "/dashboard/staff/kk-analytics": ["Explain municipality KK analytics", "How do I export this data?", "What trends should I check?"],
    "/dashboard/staff/admissions": ["How do I review an admission?", "What does pending mean?", "How do I approve or reject safely?"],
    "/dashboard/staff/admissions-profiles": ["How do I review an admission?", "What does pending mean?", "How do I approve or reject safely?"],
    "/dashboard/staff/digital-admission": ["How do I review an admission?", "What does pending mean?", "How do I approve or reject safely?"],
  },
  OFFICIAL: {
    "/dashboard/official": ["Explain my official dashboard", "What can I do as SK Official?", "Where is KK Management?"],
    "/dashboard/official/kk-registry": ["How do I approve a KK profile?", "How do I create an invite link?", "How do I issue certificates?"],
    "/dashboard/official/kk-analytics": ["Explain barangay KK analytics", "What does this chart mean?", "How do I use this for planning?"],
    "/dashboard/official/kk-management": ["What is KK Management?", "How do I manage members?", "How do I track participation?"],
  },
  KK_MEMBER: {
    "/dashboard/kk-member": ["Explain my KK dashboard", "What should I complete first?", "Where is my YouthPass?"],
    "/dashboard/kk-member/profile": ["How do I complete my profile?", "Why is consent needed?", "What happens after submission?"],
    "/dashboard/kk-member/youthpass": ["How do I use my YouthPass?", "How do I verify my QR?", "Why is my status pending?"],
    "/dashboard/kk-member/certificates": ["Where are my certificates?", "How do I print a certificate?", "How can it be verified?"],
  },
};

export function getAssistantQuickPrompts(role: DashboardRole, currentPath: string): string[] {
  const path = currentPath.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  const roleRoot = `/dashboard/${role.toLowerCase().replace("_", "-")}`;
  if (path !== roleRoot && !path.startsWith(`${roleRoot}/`)) return SKTECH_ROLE_HELP[role].quickPrompts;

  const match = Object.keys(pagePrompts[role])
    .sort((a, b) => b.length - a.length)
    .find((section) => path === section || (section !== roleRoot && path.startsWith(`${section}/`)));
  return match ? pagePrompts[role][match] : SKTECH_ROLE_HELP[role].quickPrompts;
}
