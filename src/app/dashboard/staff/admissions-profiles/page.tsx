import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function StaffAdmissionsHub() { return <DashboardHubPage title="Admissions & Profiles" description="Review admissions and official records." scope="Staff" features={[
  { title: "Admissions Review", description: "Review official joiners.", href: "/dashboard/staff/admissions" },
  { title: "SK Profiling", description: "Manage municipal official records.", href: "/dashboard/staff/profiling" },
  { title: "Digital ID Admission", description: "Digital admission workspace.", href: "/dashboard/staff/digital-admission" },
]} />; }
