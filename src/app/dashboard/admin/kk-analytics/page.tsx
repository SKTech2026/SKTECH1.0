import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import KkAnalyticsDashboard from "@/components/kk/kk-analytics-dashboard";
import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";
import { getKkAnalyticsData, resolveKkAnalyticsScope } from "@/lib/kk/analytics";

export const dynamic = "force-dynamic";

export default async function AdminKkAnalyticsPage() {
  const session = await getServerSession(authOptions);
  requireDashboardRole(session, [Role.ADMIN], {
    unauthenticatedRedirect: "/login?role=ADMIN",
  });

  const scope = await resolveKkAnalyticsScope();
  if (!scope || scope.role !== Role.ADMIN) {
    redirect("/unauthorized");
  }

  const analytics = await getKkAnalyticsData(scope);

  return (
    <main className="space-y-7">
      <KkAnalyticsDashboard
        title="Province KK Analytics"
        subtitle="Province-wide overview of registrations, demographics, participation, and data quality across Oriental Mindoro."
        stats={[
          { label: "Total KK Members", value: String(analytics.totals.totalMembers), detail: "All records in scope" },
          { label: "Verified", value: String(analytics.totals.verifiedMembers), detail: `${analytics.totals.registrationCompletionRate}% complete` },
          { label: "Pending Verification", value: String(analytics.totals.pendingVerification), detail: "Awaiting review" },
          { label: "YouthPass Active", value: String(analytics.youthPass.verified), detail: "Currently verified" },
          { label: "Certificates Issued", value: String(analytics.certificates.totalIssued), detail: "Total awarded" },
          { label: "KK Assembly Attendance", value: String(analytics.civic.attendedKkAssembly), detail: "Members with attendance marked" },
        ]}
        demographics={[
          { title: "Age group distribution", items: analytics.demographics.ageGroups },
          { title: "Sex assigned at birth", items: analytics.demographics.sexAssignedAtBirth },
          { title: "Civil status", items: analytics.demographics.civilStatus },
          { title: "Educational background", items: analytics.demographics.educationalBackground },
          { title: "Youth classification", items: analytics.demographics.youthClassification },
          { title: "Specific needs category", items: analytics.demographics.specificNeedsCategory },
        ]}
        civic={[
          { title: "Registered SK voters", items: [{ label: "Yes", count: analytics.civic.registeredSkVoter, percentage: analytics.totals.totalMembers ? Number(((analytics.civic.registeredSkVoter / analytics.totals.totalMembers) * 100).toFixed(1)) : 0 }] },
          { title: "Registered national voters", items: [{ label: "Yes", count: analytics.civic.registeredNationalVoter, percentage: analytics.totals.totalMembers ? Number(((analytics.civic.registeredNationalVoter / analytics.totals.totalMembers) * 100).toFixed(1)) : 0 }] },
          { title: "Voted last election", items: [{ label: "Yes", count: analytics.civic.votedLastElection, percentage: analytics.totals.totalMembers ? Number(((analytics.civic.votedLastElection / analytics.totals.totalMembers) * 100).toFixed(1)) : 0 }] },
          { title: "Attended KK Assembly", items: [{ label: "Yes", count: analytics.civic.attendedKkAssembly, percentage: analytics.totals.totalMembers ? Number(((analytics.civic.attendedKkAssembly / analytics.totals.totalMembers) * 100).toFixed(1)) : 0 }] },
          { title: "KK Assembly frequency", items: analytics.civic.kkAssemblyFrequency },
          { title: "Reasons for not attending KK Assembly", items: analytics.civic.noKkAssemblyReason },
        ]}
        coverage={[
          { title: "KK members per municipality", items: analytics.coverage.municipalityTotals },
          { title: "KK members per barangay", items: analytics.coverage.barangayTotals },
          { title: "Municipalities with low profiling", items: analytics.coverage.lowProfilingMunicipalities },
          { title: "Barangays with no KK profiles", items: analytics.coverage.barangaysWithoutProfiles },
        ]}
        youthPass={[
          { label: "Eligible", value: String(analytics.youthPass.eligible), detail: "Profiles ready for YouthPass assessment" },
          { label: "Pending", value: String(analytics.youthPass.pendingVerification), detail: "Awaiting verification" },
          { label: "Verified", value: String(analytics.youthPass.verified), detail: "Included in public verification" },
          { label: "Public verifications", value: String(analytics.youthPass.publicVerifications), detail: "Publicly tracked checks" },
        ]}
        certificates={[
          { title: "Certificates by type", items: analytics.certificates.byType },
          { title: "Certificates this month", items: [{ label: "This month", count: analytics.certificates.thisMonth, percentage: analytics.certificates.totalIssued ? Number(((analytics.certificates.thisMonth / analytics.certificates.totalIssued) * 100).toFixed(1)) : 0 }] },
          { title: "Certificates by event/program", items: analytics.certificates.byEvent },
          { title: "Revoked certificates", items: [{ label: "Revoked", count: analytics.certificates.revoked, percentage: analytics.certificates.totalIssued ? Number(((analytics.certificates.revoked / analytics.certificates.totalIssued) * 100).toFixed(1)) : 0 }] },
        ]}
        quality={[
          { label: "Profiles with missing optional fields", value: String(analytics.dataQuality.missingOptionalFields), detail: "Needed for richer reporting" },
          { label: "Missing contact number", value: String(analytics.dataQuality.missingContactNumber), detail: "Critical outreach field" },
          { label: "Missing education background", value: String(analytics.dataQuality.missingEducationBackground), detail: "Education tracking" },
          { label: "Missing work status", value: String(analytics.dataQuality.missingWorkStatus), detail: "Employment follow-up" },
          { label: "Duplicate risk count", value: String(analytics.dataQuality.duplicateRiskCount), detail: "Safe deduplication checks" },
          { label: "Incomplete consent count", value: String(analytics.dataQuality.incompleteConsentCount), detail: "Consent completeness" },
        ]}
        insights={analytics.insights}
        emptyMessage="No KK profiles recorded yet."
      />
    </main>
  );
}
