import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function AdminSystemHub() { return <DashboardHubPage title="System & Security" description="Monitor system health and accountability." scope="Admin only" features={[
  { title: "System Health", description: "Monitor application health.", href: "/dashboard/admin/system-health" },
  { title: "Audit Trail", description: "Review recorded actions.", href: "/dashboard/admin/audit-trail" },
  { title: "Compliance Monitoring", description: "Check compliance indicators.", href: "/dashboard/admin/compliance" },
]} />; }
