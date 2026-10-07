import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function StaffOperationsHub() { return <DashboardHubPage title="Staff Operations" description="Daily municipal workspaces." scope="Staff" features={[
  { title: "Admissions Review", description: "Review official admissions.", href: "/dashboard/staff/admissions" },
  { title: "SK Profiling", description: "Manage assigned municipality records.", href: "/dashboard/staff/profiling" },
  { title: "Digital ID Admission", description: "Open the digital admission workspace.", href: "/dashboard/staff/digital-admission" },
  { title: "Chat", description: "Municipal coordination messages.", href: "/dashboard/staff/chat" },
]} />; }
