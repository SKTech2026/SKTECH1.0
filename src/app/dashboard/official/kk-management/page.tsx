import { redirect } from "next/navigation";
import { DashboardHubPage } from "@/components/dashboard/feature-hub";
import { getChairScope } from "@/lib/kk";
export default async function OfficialKkHub() { if (!(await getChairScope())) redirect("/dashboard/official"); return <DashboardHubPage title="KK Management" description="Review youth profiles and barangay services." scope="SK Chairperson" features={[
  { title: "KK Registry", description: "Review profiles, invitations, and verification.", href: "/dashboard/official/kk-registry" },
  { title: "Invite Links", description: "Create a barangay specific KK invitation.", href: "/dashboard/official/kk-registry" },
  { title: "Certificate Issuance", description: "Issue certificates to verified youth members.", href: "/dashboard/official/kk-registry" },
  { title: "KK Analytics", description: "View aggregate barangay youth reporting.", href: "/dashboard/official/kk-analytics" },
]} />; }
