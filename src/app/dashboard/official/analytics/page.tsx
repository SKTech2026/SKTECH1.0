import { DashboardHubPage } from "@/components/dashboard/feature-hub";
import { getChairScope } from "@/lib/kk";
export default async function OfficialAnalyticsHub() { const chair = await getChairScope(); return <DashboardHubPage title="Analytics & Reports" description="Barangay youth reporting and participation." scope="SK Official" features={[
  ...(chair ? [{ title: "KK Analytics", description: "Aggregate barangay youth and certificate reporting.", href: "/dashboard/official/kk-analytics" }] : []),
  { title: "Attendance Logs", description: "Review your participation history.", href: "/dashboard/official/attendance" },
  { title: "Accomplishments", description: "Review federation milestones.", href: "/dashboard/official/accomplishments" },
]} />; }
