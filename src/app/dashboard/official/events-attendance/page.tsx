import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function OfficialEventsHub() { return <DashboardHubPage title="Events & Attendance" description="Your participation and accomplishments." scope="SK Official" features={[
  { title: "Attendance Logs", description: "Review your attendance.", href: "/dashboard/official/attendance" },
  { title: "Accomplishments", description: "Review federation milestones.", href: "/dashboard/official/accomplishments" },
]} />; }
