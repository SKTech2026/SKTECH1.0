import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import KkAnalyticsDashboard from "@/components/kk/kk-analytics-dashboard";
import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";
import { getKkAnalyticsData, resolveKkAnalyticsScope } from "@/lib/kk/analytics";

export const dynamic = "force-dynamic";

export default async function StaffKkAnalyticsPage() {
  const session = await getServerSession(authOptions);
  requireDashboardRole(session, [Role.STAFF], {
    unauthenticatedRedirect: "/login?role=STAFF",
  });

  const scope = await resolveKkAnalyticsScope();
  if (!scope || scope.role !== Role.STAFF || !scope.municipalityId) {
    redirect("/unauthorized");
  }

  const analytics = await getKkAnalyticsData(scope);

  return (
    <main className="space-y-7">
      <KkAnalyticsDashboard
        title="Municipal KK Analytics"
        subtitle="Municipality-only KK dashboard scoped to your assigned locality. Private and individual records stay aggregated and protected."
        statusBreakdown={[
          { label: "Verified", count: analytics.totals.verifiedMembers, color: "bg-emerald-500" },
          { label: "Pending", count: analytics.totals.pendingVerification, color: "bg-amber-500" },
          { label: "Needs correction", count: analytics.totals.needsCorrection, color: "bg-orange-500" },
          { label: "Rejected", count: analytics.totals.rejected, color: "bg-rose-500" },
          { label: "Archived", count: analytics.totals.archived, color: "bg-slate-500" },
        ]}
        stats={[
          { label: "Total KK Members", value: String(analytics.totals.totalMembers), detail: "Records in assigned municipality" },
          { label: "Verified", value: String(analytics.totals.verifiedMembers), detail: `${analytics.totals.registrationCompletionRate}% completion rate` },
          { label: "Pending Verification", value: String(analytics.totals.pendingVerification), detail: "In review" },
          { label: "YouthPass Active", value: String(analytics.youthPass.verified), detail: "Verified youth records" },
          { label: "Certificates Issued", value: String(analytics.certificates.totalIssued), detail: "Issued in scope" },
          { label: "KK Assembly Attendance", value: String(analytics.civic.attendedKkAssembly), detail: "Marked attendance" },
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
          { title: "KK members per barangay", items: analytics.coverage.barangayTotals },
          { title: "Barangays with low profiling", items: analytics.coverage.barangaysWithoutProfiles.length > 0 ? analytics.coverage.barangaysWithoutProfiles : [{ label: "No low-barangay alerts", count: 0, percentage: 0 }] },
          { title: "Barangays with no KK profiles", items: analytics.coverage.barangaysWithoutProfiles },
        ]}
        youthPass={[
          { label: "Eligible", value: String(analytics.youthPass.eligible), detail: "Profiles eligible for YouthPass" },
          { label: "Pending", value: String(analytics.youthPass.pendingVerification), detail: "Awaiting verification" },
          { label: "Verified", value: String(analytics.youthPass.verified), detail: "Verified YouthPass records" },
          { label: "Public verifications", value: String(analytics.youthPass.publicVerifications), detail: "Publicly tracked checks" },
        ]}
        certificates={[
          { title: "Certificates by type", items: analytics.certificates.byType },
          { title: "Certificates this month", items: [{ label: "This month", count: analytics.certificates.thisMonth, percentage: analytics.certificates.totalIssued ? Number(((analytics.certificates.thisMonth / analytics.certificates.totalIssued) * 100).toFixed(1)) : 0 }] },
          { title: "Certificates by event/program", items: analytics.certificates.byEvent },
          { title: "Revoked certificates", items: [{ label: "Revoked", count: analytics.certificates.revoked, percentage: analytics.certificates.totalIssued ? Number(((analytics.certificates.revoked / analytics.certificates.totalIssued) * 100).toFixed(1)) : 0 }] },
        ]}
        quality={[
          { label: "Missing optional fields", value: String(analytics.dataQuality.missingOptionalFields), detail: "Incomplete record coverage" },
          { label: "Missing contact number", value: String(analytics.dataQuality.missingContactNumber), detail: "Contact follow-up needed" },
          { label: "Missing education background", value: String(analytics.dataQuality.missingEducationBackground), detail: "Back-to-school support" },
          { label: "Missing work status", value: String(analytics.dataQuality.missingWorkStatus), detail: "Employment support tracking" },
          { label: "Duplicate risk count", value: String(analytics.dataQuality.duplicateRiskCount), detail: "Safe deduplication review" },
          { label: "Incomplete consent count", value: String(analytics.dataQuality.incompleteConsentCount), detail: "Consent follow-up" },
        ]}
        insights={analytics.insights}
        emptyMessage="No KK profiles recorded yet."
      />
    </main>
  );
}
