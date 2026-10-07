import type { KkAnalyticsPayload } from "@/lib/kk/analytics";
import { KK_ANALYTICS_RANGES } from "@/lib/kk/analytics-range";

export function kkRangeLabel(range: KkAnalyticsPayload["period"]["range"]) {
  return KK_ANALYTICS_RANGES.find((option) => option.value === range)?.label ?? "All time";
}

export function kkReportSections(data: KkAnalyticsPayload) {
  const t = data.totals;
  const c = data.civic;
  const cert = data.certificates;
  const quality = data.dataQuality;
  const section = (title: string, rows: Array<[string, string | number]>) => ({ title, rows });
  const buckets = (items: Array<{ label: string; count: number }>): Array<[string, number]> => items.map((item) => [item.label, item.count]);
  return [
    section("KPI summary - all time", [
      ["Total KK members", t.totalMembers], ["Verified", t.verifiedMembers], ["Pending verification", t.pendingVerification],
      ["YouthPass active", data.youthPass.verified], ["Certificates issued", cert.totalIssued], ["KK assembly attendance", c.attendedKkAssembly],
      [`New registrations - ${kkRangeLabel(data.period.range)}`, data.period.newRegistrations],
      [`Certificates issued - ${kkRangeLabel(data.period.range)}`, data.period.certificatesIssued],
    ]),
    section("Registration status - current snapshot", [
      ["Verified", t.verifiedMembers], ["Pending", t.pendingVerification], ["Needs correction", t.needsCorrection],
      ["Rejected", t.rejected], ["Archived", t.archived],
    ]),
    section("Demographics - all time: age groups", buckets(data.demographics.ageGroups)),
    section("Demographics - all time: sex assigned at birth", buckets(data.demographics.sexAssignedAtBirth)),
    section("Demographics - all time: civil status", buckets(data.demographics.civilStatus)),
    section("Demographics - all time: education", buckets(data.demographics.educationalBackground)),
    section("Demographics - all time: youth classification", buckets(data.demographics.youthClassification)),
    section("Demographics - all time: specific needs", buckets(data.demographics.specificNeedsCategory)),
    section("Demographics - all time: work status", buckets(data.demographics.workStatus)),
    section("Civic participation - all time", [
      ["Registered SK voter", c.registeredSkVoter], ["Registered national voter", c.registeredNationalVoter],
      ["Voted last election", c.votedLastElection], ["Attended KK Assembly", c.attendedKkAssembly],
    ]),
    section("KK Assembly frequency - all time", buckets(c.kkAssemblyFrequency)),
    section("Reasons for no KK Assembly - all time", buckets(c.noKkAssemblyReason)),
    section("Coverage - all time: municipality", buckets(data.coverage.municipalityTotals)),
    section("Coverage - all time: barangay", buckets(data.coverage.barangayTotals)),
    section("Coverage - all time: areas with no profiles", buckets(data.coverage.barangaysWithoutProfiles)),
    section("Coverage - all time: low profiling municipalities", buckets(data.coverage.lowProfilingMunicipalities)),
    section("YouthPass - all time", [
      ["Eligible", data.youthPass.eligible], ["Pending", data.youthPass.pendingVerification],
      ["Verified", data.youthPass.verified], ["Public verifications", data.youthPass.publicVerifications],
    ]),
    section(`Certificates by type - ${kkRangeLabel(data.period.range)}`, buckets(data.period.certificateTypes)),
    section("Certificates by event - all time", buckets(cert.byEvent)),
    section("Certificate summary", [
      ["Issued in selected period", data.period.certificatesIssued], ["Issued all time", cert.totalIssued],
      ["Revoked all time", cert.revoked],
    ]),
    section("Data quality - all time", [
      ["Missing optional fields", quality.missingOptionalFields], ["Missing contact number", quality.missingContactNumber],
      ["Missing education background", quality.missingEducationBackground], ["Missing work status", quality.missingWorkStatus],
      ["Duplicate risk", quality.duplicateRiskCount], ["Incomplete consent", quality.incompleteConsentCount],
    ]),
    section("Action insights", data.insights.map((item) => [item.title, `${item.value} - ${item.detail}`])),
  ];
}

export function kkAnalyticsCsv(data: KkAnalyticsPayload, generatedAt: Date) {
  const cell = (value: string | number) => {
    const plain = String(value);
    const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(plain) ? `'${plain}` : plain;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const row = (...values: Array<string | number>) => values.map(cell).join(",");
  const lines = [
    row("SKTECH / Oriental Mindoro SK Federation"),
    row("KK Analytics Report"),
    row("Scope", data.scopeLabel),
    row("Date range", kkRangeLabel(data.period.range)),
    row("Generated at (PHT)", generatedAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" })),
    row("Data notice", "Aggregate analytics only; no private KK profile records included."),
  ];
  for (const section of kkReportSections(data)) {
    lines.push("", row(section.title), row("Metric", "Count / detail"));
    lines.push(...section.rows.map(([label, value]) => row(label, value)));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}
