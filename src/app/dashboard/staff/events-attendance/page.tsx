import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function StaffEventsHub() { return <DashboardHubPage title="Events & Attendance" description="Municipal events and attendance tools." scope="Staff" features={[
  { title: "Events", description: "Manage municipal events.", href: "/dashboard/staff/events" },
  { title: "Attendance Monitor", description: "Review attendance activity.", href: "/dashboard/staff/attendance-monitoring" },
  { title: "ID Scanning", description: "Scan IDs for event attendance.", href: "/dashboard/staff/id-scanning" },
  { title: "Event Kiosk", description: "Open the attendance kiosk.", href: "/dashboard/staff/event-kiosk" },
]} />; }
