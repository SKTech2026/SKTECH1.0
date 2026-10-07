import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function AdminAccessHub() { return <DashboardHubPage title="User & Access Management" description="Manage municipal assignments and staff access." scope="Admin only" features={[
  { title: "Staff Admission", description: "Create and review staff accounts.", href: "/dashboard/admin/staff-admission" },
  { title: "Staff Access", description: "Manage staff account access.", href: "/dashboard/admin/staff-access" },
  { title: "Municipalities", description: "Manage municipal assignments.", href: "/dashboard/admin/municipalities" },
  { title: "Archive Bin", description: "Review archived records.", href: "/dashboard/admin/archive" },
]} />; }
