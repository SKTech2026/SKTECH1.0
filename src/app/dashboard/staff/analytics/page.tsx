import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function StaffAnalyticsHub() { return <DashboardHubPage title="Analytics & Reports" description="Municipality scoped monitoring." scope="Staff" features={[
  { title: "KK Analytics", description: "Aggregate youth participation for your municipality.", href: "/dashboard/staff/kk-analytics" },
  { title: "Attendance Monitor", description: "Monitor event attendance and logs.", href: "/dashboard/staff/attendance-monitoring" },
  { title: "Events", description: "Review municipal events and activity.", href: "/dashboard/staff/events" },
]} />; }
