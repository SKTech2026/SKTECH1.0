import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function IdManagementHub() { return <DashboardHubPage title="ID Management" description="Create, design, and verify official IDs." scope="Admin only" features={[
  { title: "ID Production", description: "Produce official identity cards.", href: "/dashboard/admin/id-production" },
  { title: "ID Template Designer", description: "Manage the card layout.", href: "/dashboard/admin/id-template" },
  { title: "ID Scanning", description: "Verify IDs and record attendance.", href: "/dashboard/admin/id-scanning" },
]} />; }
