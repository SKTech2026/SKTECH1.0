import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function AdminAnalyticsHub() { return <DashboardHubPage title="Overall Analytics" description="Provincial monitoring and reports." scope="Admin only" features={[
  { title: "Provincial Analytics", description: "Official coverage, activity, and municipality trends.", href: "/dashboard/admin/analytics/provincial" },
  { title: "KK Analytics", description: "Aggregate youth registry and participation insights.", href: "/dashboard/admin/kk-analytics" },
  { title: "Compliance Analytics", description: "Compliance indicators and reports.", href: "/dashboard/admin/compliance" },
  { title: "Geographic Coverage", description: "Municipality coverage in the provincial view.", href: "/dashboard/admin/analytics/provincial" },
  { title: "Event Activity", description: "Provincial events and participation.", href: "/dashboard/admin/events" },
]} />; }
