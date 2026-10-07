import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function AdminEventsHub() { return <DashboardHubPage title="Events & Attendance" description="Manage events, scanning, and announcements." scope="Admin only" features={[
  { title: "Event Management", description: "Create and manage provincial events.", href: "/dashboard/admin/events" },
  { title: "ID Scanning", description: "Verify attendance by ID.", href: "/dashboard/admin/id-scanning" },
  { title: "Internal Feed", description: "Coordinate with municipal staff.", href: "/dashboard/admin/feed" },
  { title: "Public News Feed", description: "Publish public updates.", href: "/dashboard/admin/public-news" },
]} />; }
