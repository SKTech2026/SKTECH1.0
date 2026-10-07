import { DashboardHubPage } from "@/components/dashboard/feature-hub";
export default function OfficialServicesHub() { return <DashboardHubPage title="Official Services" description="Your profile and identity tools." scope="SK Official" features={[
  { title: "Admission Details", description: "Submit verification details.", href: "/dashboard/official/admission" },
  { title: "Profile", description: "Update your account and photo.", href: "/dashboard/official/profile" },
  { title: "Digital ID", description: "View your official ID.", href: "/dashboard/official/digital-id" },
  { title: "Chat", description: "Municipal messages.", href: "/dashboard/official/chat" },
]} />; }
