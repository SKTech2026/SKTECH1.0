import { KKCertificateStatus, KKProfileStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getChairScope } from "@/lib/kk";

export type KkAnalyticsScope = {
  role: "ADMIN" | "STAFF" | "OFFICIAL";
  municipalityId?: string | null;
  barangayId?: string | null;
  municipalityName?: string | null;
  barangayName?: string | null;
};

export type DistributionBucket = {
  label: string;
  count: number;
  percentage: number;
};

export type KkAnalyticsInsight = {
  title: string;
  value: string;
  detail: string;
};

export type KkAnalyticsPayload = {
  scopeLabel: string;
  totals: {
    totalMembers: number;
    verifiedMembers: number;
    pendingVerification: number;
    needsCorrection: number;
    rejected: number;
    archived: number;
    newRegistrationsThisMonth: number;
    registrationCompletionRate: number;
  };
  demographics: {
    ageGroups: DistributionBucket[];
    sexAssignedAtBirth: DistributionBucket[];
    civilStatus: DistributionBucket[];
    educationalBackground: DistributionBucket[];
    youthClassification: DistributionBucket[];
    specificNeedsCategory: DistributionBucket[];
    workStatus: DistributionBucket[];
  };
  civic: {
    registeredSkVoter: number;
    registeredNationalVoter: number;
    votedLastElection: number;
    attendedKkAssembly: number;
    kkAssemblyFrequency: DistributionBucket[];
    noKkAssemblyReason: DistributionBucket[];
  };
  coverage: {
    municipalityTotals: DistributionBucket[];
    barangayTotals: DistributionBucket[];
    lowProfilingMunicipalities: DistributionBucket[];
    barangaysWithoutProfiles: DistributionBucket[];
    ownBarangayTotal: number;
    ownBarangayCompletion: number;
  };
  youthPass: {
    eligible: number;
    pendingVerification: number;
    verified: number;
    publicVerifications: number;
  };
  certificates: {
    totalIssued: number;
    byType: DistributionBucket[];
    thisMonth: number;
    byEvent: DistributionBucket[];
    revoked: number;
  };
  dataQuality: {
    missingOptionalFields: number;
    missingContactNumber: number;
    missingEducationBackground: number;
    missingWorkStatus: number;
    duplicateRiskCount: number;
    incompleteConsentCount: number;
  };
  insights: KkAnalyticsInsight[];
};

const toPercent = (count: number, total: number) => (total ? Number(((count / total) * 100).toFixed(1)) : 0);

const normalizeLabel = (value: string | null | undefined) => {
  const cleaned = (value ?? "").trim();
  return cleaned || "Unspecified";
};

const buildDistribution = (
  entries: Map<string, number>,
  total: number,
): DistributionBucket[] => {
  const sorted = [...entries.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.map(([label, count]) => ({
    label: normalizeLabel(label),
    count,
    percentage: toPercent(count, total),
  }));
};

const countTruthy = (items: Array<number | boolean | null | undefined>) =>
  items.filter((value) => value === true || value === 1).length;

const countStringMatches = (profiles: Array<Record<string, unknown>>, field: string, patterns: RegExp[]) => {
  return profiles.filter((profile) => {
    const value = String(profile[field] ?? "");
    return patterns.some((pattern) => pattern.test(value));
  }).length;
};

const resolveStatuses = (profiles: Array<Record<string, unknown>>) => {
  const statusMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = String(profile["status"] ?? "UNKNOWN");
    statusMap.set(key, (statusMap.get(key) ?? 0) + 1);
  }
  return statusMap;
};

export async function resolveKkAnalyticsScope(): Promise<KkAnalyticsScope | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  if (session.user.role === Role.ADMIN && session.user.status === UserStatus.APPROVED) {
    return { role: Role.ADMIN };
  }

  if (session.user.role === Role.STAFF && session.user.status === UserStatus.APPROVED && session.user.municipalityPresidentId) {
    return { role: Role.STAFF, municipalityId: session.user.municipalityPresidentId };
  }

  if (session.user.role === Role.OFFICIAL && session.user.status === UserStatus.APPROVED) {
    const scope = await getChairScope();
    if (!scope) return null;
    return {
      role: Role.OFFICIAL,
      municipalityId: scope.municipalityId,
      barangayId: scope.barangayId,
    };
  }

  return null;
}

export async function getKkAnalyticsData(scope: KkAnalyticsScope): Promise<KkAnalyticsPayload> {
  const baseWhere = scope.role === Role.ADMIN
    ? {}
    : scope.role === Role.STAFF
      ? { municipalityId: scope.municipalityId ?? "__none__" }
      : { municipalityId: scope.municipalityId ?? "__none__", barangayId: scope.barangayId ?? "__none__" };

  const profiles = await prisma.kKMemberProfile.findMany({
    where: baseWhere,
    select: {
      id: true,
      status: true,
      createdAt: true,
      municipalityId: true,
      barangayId: true,
      age: true,
      sexAssignedAtBirth: true,
      civilStatus: true,
      youthAgeGroup: true,
      educationalBackground: true,
      youthClassification: true,
      specificNeedsCategory: true,
      workStatus: true,
      registeredSkVoter: true,
      registeredNationalVoter: true,
      votedLastElection: true,
      attendedKkAssembly: true,
      kkAssemblyAttendanceFrequency: true,
      noKkAssemblyReason: true,
      contactNumber: true,
      dataPrivacyConsent: true,
      profilingConsent: true,
      aggregateReportingConsent: true,
      communicationConsent: true,
      firstName: true,
      lastName: true,
      birthdate: true,
      municipality: { select: { name: true } },
      barangay: { select: { name: true } },
    },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const totalMembers = profiles.length;
  const statusMap = resolveStatuses(profiles);
  const verifiedMembers = statusMap.get(KKProfileStatus.VERIFIED) ?? 0;
  const pendingVerification = [KKProfileStatus.PENDING_EMAIL_VERIFICATION, KKProfileStatus.PENDING_VERIFICATION]
    .reduce((sum, status) => sum + (statusMap.get(status) ?? 0), 0);
  const needsCorrection = statusMap.get(KKProfileStatus.NEEDS_CORRECTION) ?? 0;
  const rejected = statusMap.get(KKProfileStatus.REJECTED) ?? 0;
  const archived = statusMap.get(KKProfileStatus.ARCHIVED) ?? 0;
  const newRegistrationsThisMonth = profiles.filter((profile) => profile.createdAt >= monthStart).length;

  const completionEligible = profiles.filter((profile) => {
    return Boolean(
      profile.firstName &&
      profile.lastName &&
      profile.age &&
      profile.sexAssignedAtBirth &&
      profile.civilStatus &&
      profile.youthAgeGroup &&
      profile.educationalBackground &&
      profile.youthClassification &&
      profile.workStatus &&
      profile.registeredSkVoter !== null &&
      profile.registeredNationalVoter !== null &&
      profile.votedLastElection !== null &&
      profile.attendedKkAssembly !== null,
    );
  }).length;

  const ageGroupsMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.youthAgeGroup ?? "Unspecified");
    ageGroupsMap.set(key, (ageGroupsMap.get(key) ?? 0) + 1);
  }

  const sexMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.sexAssignedAtBirth ?? "Unspecified");
    sexMap.set(key, (sexMap.get(key) ?? 0) + 1);
  }

  const civilStatusMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.civilStatus ?? "Unspecified");
    civilStatusMap.set(key, (civilStatusMap.get(key) ?? 0) + 1);
  }

  const educationMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.educationalBackground ?? "Unspecified");
    educationMap.set(key, (educationMap.get(key) ?? 0) + 1);
  }

  const youthClassMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.youthClassification ?? "Unspecified");
    youthClassMap.set(key, (youthClassMap.get(key) ?? 0) + 1);
  }

  const needMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.specificNeedsCategory ?? "Unspecified");
    needMap.set(key, (needMap.get(key) ?? 0) + 1);
  }

  const workMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.workStatus ?? "Unspecified");
    workMap.set(key, (workMap.get(key) ?? 0) + 1);
  }

  const registeredSkVoter = countTruthy(profiles.map((profile) => profile.registeredSkVoter));
  const registeredNationalVoter = countTruthy(profiles.map((profile) => profile.registeredNationalVoter));
  const votedLastElection = countTruthy(profiles.map((profile) => profile.votedLastElection));
  const attendedKkAssembly = countTruthy(profiles.map((profile) => profile.attendedKkAssembly));

  const kkAssemblyFrequencyMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.kkAssemblyAttendanceFrequency ?? "Unspecified");
    kkAssemblyFrequencyMap.set(key, (kkAssemblyFrequencyMap.get(key) ?? 0) + 1);
  }

  const noKkAssemblyReasonMap = new Map<string, number>();
  for (const profile of profiles) {
    const key = normalizeLabel(profile.noKkAssemblyReason ?? "Unspecified");
    noKkAssemblyReasonMap.set(key, (noKkAssemblyReasonMap.get(key) ?? 0) + 1);
  }

  const municipalityTotalsMap = new Map<string, number>();
  const barangayTotalsMap = new Map<string, number>();
  for (const profile of profiles) {
    const municipalityLabel = normalizeLabel(profile.municipality?.name ?? "Unknown");
    const barangayLabel = normalizeLabel(profile.barangay?.name ?? "Unknown");
    municipalityTotalsMap.set(municipalityLabel, (municipalityTotalsMap.get(municipalityLabel) ?? 0) + 1);
    barangayTotalsMap.set(barangayLabel, (barangayTotalsMap.get(barangayLabel) ?? 0) + 1);
  }

  const municipalityLookup = await prisma.municipality.findMany({
    where: scope.role === Role.ADMIN
      ? {}
      : { id: scope.municipalityId ?? "__none__" },
    select: { id: true, name: true, barangays: { select: { id: true, name: true } } },
  });

  const barangayRecords = await prisma.barangay.findMany({
    where: scope.role === Role.ADMIN
      ? {}
      : { municipalityId: scope.municipalityId ?? "__none__" },
    select: { id: true, name: true, municipalityId: true },
  });

  const lowProfilingMunicipalities = municipalityLookup
    .map((municipality) => ({
      label: municipality.name,
      count: municipalityTotalsMap.get(municipality.name) ?? 0,
    }))
    .filter((municipality) => municipality.count < 5)
    .map((municipality) => ({
      label: municipality.label,
      count: municipality.count,
      percentage: toPercent(municipality.count, Math.max(1, totalMembers || 1)),
    }));

  const barangaysWithoutProfiles = barangayRecords
    .filter((barangay) => !(barangayTotalsMap.has(barangay.name)))
    .map((barangay) => ({
      label: barangay.name,
      count: 0,
      percentage: 0,
    }));

  const ownBarangayTotal = scope.role === Role.OFFICIAL
    ? profiles.length
    : 0;
  const ownBarangayCompletion = scope.role === Role.OFFICIAL && ownBarangayTotal > 0
    ? Number(((completionEligible / ownBarangayTotal) * 100).toFixed(1))
    : 0;

  const youthPassEligible = profiles.filter((profile) => profile.status === KKProfileStatus.VERIFIED || profile.status === KKProfileStatus.PENDING_VERIFICATION).length;
  const youthPassPending = profiles.filter((profile) => profile.status === KKProfileStatus.PENDING_EMAIL_VERIFICATION || profile.status === KKProfileStatus.PENDING_VERIFICATION).length;
  const youthPassVerified = profiles.filter((profile) => profile.status === KKProfileStatus.VERIFIED).length;

  const certificates = await prisma.kKCertificate.findMany({
    where: scope.role === Role.ADMIN
      ? {}
      : scope.role === Role.STAFF
        ? { kkMemberProfile: { municipalityId: scope.municipalityId ?? "__none__" } }
        : { kkMemberProfile: { municipalityId: scope.municipalityId ?? "__none__", barangayId: scope.barangayId ?? "__none__" } },
    select: {
      id: true,
      certificateType: true,
      status: true,
      issuedAt: true,
      event: { select: { title: true } },
      kkMemberProfile: { select: { municipalityId: true, barangayId: true } },
    },
  });

  const certificateTypeMap = new Map<string, number>();
  for (const certificate of certificates) {
    const key = certificate.certificateType ?? "UNKNOWN";
    certificateTypeMap.set(key, (certificateTypeMap.get(key) ?? 0) + 1);
  }

  const certificateByEventMap = new Map<string, number>();
  for (const certificate of certificates) {
    const key = normalizeLabel(certificate.event?.title ?? "Unassigned");
    certificateByEventMap.set(key, (certificateByEventMap.get(key) ?? 0) + 1);
  }

  const certificatesThisMonth = certificates.filter((certificate) => certificate.issuedAt >= monthStart).length;
  const revokedCertificates = certificates.filter((certificate) => certificate.status === KKCertificateStatus.REVOKED).length;

  const missingOptionalFields = profiles.filter((profile) => {
    return !profile.sexAssignedAtBirth || !profile.youthAgeGroup || !profile.civilStatus || !profile.educationalBackground || !profile.youthClassification || !profile.specificNeedsCategory || !profile.workStatus;
  }).length;

  const missingContactNumber = profiles.filter((profile) => !profile.contactNumber).length;
  const missingEducationBackground = profiles.filter((profile) => !profile.educationalBackground).length;
  const missingWorkStatus = profiles.filter((profile) => !profile.workStatus).length;

  const duplicateKeyMap = new Map<string, number>();
  for (const profile of profiles) {
    if (!profile.firstName || !profile.lastName || !profile.birthdate) continue;
    const key = `${profile.firstName.toLowerCase()}|${profile.lastName.toLowerCase()}|${new Date(profile.birthdate).toISOString().slice(0, 10)}`;
    duplicateKeyMap.set(key, (duplicateKeyMap.get(key) ?? 0) + 1);
  }

  const duplicateRiskCount = [...duplicateKeyMap.values()].filter((value) => value > 1).length;
  const incompleteConsentCount = profiles.filter((profile) => {
    return !profile.dataPrivacyConsent || !profile.profilingConsent || !profile.aggregateReportingConsent || !profile.communicationConsent;
  }).length;

  const outOfSchoolCount = countStringMatches(profiles, "educationalBackground", [/out[- ]of[- ]school/i, /not in school/i, /school leaver/i]);
  const lookingForJobCount = countStringMatches(profiles, "workStatus", [/looking for work/i, /looking for a job/i, /job seeking/i, /unemployed/i, /seeking employment/i]);

  const insights: KkAnalyticsInsight[] = [];
  if (profiles.length === 0) {
    insights.push({ title: "No KK profiles recorded yet", value: "0", detail: "No member records are currently in scope for this dashboard." });
  }
  if (barangaysWithoutProfiles.length > 0) {
    insights.push({ title: "Barangays with no KK profiles yet", value: `${barangaysWithoutProfiles.length}`, detail: "These local units still need onboarding or outreach." });
  }
  if (pendingVerification > 0 && totalMembers > 0 && (pendingVerification / totalMembers) >= 0.25) {
    insights.push({ title: "Many profiles pending verification", value: `${pendingVerification}`, detail: "Review and clear pending items to keep the registry moving." });
  }
  if (totalMembers > 0 && attendedKkAssembly < (totalMembers * 0.4)) {
    insights.push({ title: "Low KK Assembly participation", value: `${Math.round(toPercent(attendedKkAssembly, totalMembers))}%`, detail: "Attendance remains below the target threshold for local youth engagement." });
  }
  if (outOfSchoolCount > 0) {
    insights.push({ title: "High number of out-of-school youth", value: `${outOfSchoolCount}`, detail: "Consider town-level youth support and employment outreach plans." });
  }
  if (lookingForJobCount > 0) {
    insights.push({ title: "Many youth currently looking for a job", value: `${lookingForJobCount}`, detail: "Coordinate with LGU employment or skills programs for follow-up." });
  }
  if (certificatesThisMonth > 0) {
    insights.push({ title: "Certificates issued this month", value: `${certificatesThisMonth}`, detail: "This month’s certificate output is above zero and should be reviewed." });
  }

  const scopeLabel = scope.role === Role.ADMIN
    ? "Province-wide KK analytics"
    : scope.role === Role.STAFF
      ? "Municipality-level KK analytics"
      : "Barangay-level KK analytics";

  return {
    scopeLabel,
    totals: {
      totalMembers,
      verifiedMembers,
      pendingVerification,
      needsCorrection,
      rejected,
      archived,
      newRegistrationsThisMonth,
      registrationCompletionRate: totalMembers ? Number(((completionEligible / totalMembers) * 100).toFixed(1)) : 0,
    },
    demographics: {
      ageGroups: buildDistribution(ageGroupsMap, totalMembers),
      sexAssignedAtBirth: buildDistribution(sexMap, totalMembers),
      civilStatus: buildDistribution(civilStatusMap, totalMembers),
      educationalBackground: buildDistribution(educationMap, totalMembers),
      youthClassification: buildDistribution(youthClassMap, totalMembers),
      specificNeedsCategory: buildDistribution(needMap, totalMembers),
      workStatus: buildDistribution(workMap, totalMembers),
    },
    civic: {
      registeredSkVoter: registeredSkVoter,
      registeredNationalVoter: registeredNationalVoter,
      votedLastElection: votedLastElection,
      attendedKkAssembly: attendedKkAssembly,
      kkAssemblyFrequency: buildDistribution(kkAssemblyFrequencyMap, totalMembers),
      noKkAssemblyReason: buildDistribution(noKkAssemblyReasonMap, totalMembers),
    },
    coverage: {
      municipalityTotals: buildDistribution(municipalityTotalsMap, totalMembers),
      barangayTotals: buildDistribution(barangayTotalsMap, totalMembers),
      lowProfilingMunicipalities: lowProfilingMunicipalities,
      barangaysWithoutProfiles: barangaysWithoutProfiles,
      ownBarangayTotal: ownBarangayTotal,
      ownBarangayCompletion: ownBarangayCompletion,
    },
    youthPass: {
      eligible: youthPassEligible,
      pendingVerification: youthPassPending,
      verified: youthPassVerified,
      publicVerifications: 0,
    },
    certificates: {
      totalIssued: certificates.length,
      byType: buildDistribution(certificateTypeMap, Math.max(certificates.length, 1)),
      thisMonth: certificatesThisMonth,
      byEvent: buildDistribution(certificateByEventMap, Math.max(certificates.length, 1)),
      revoked: revokedCertificates,
    },
    dataQuality: {
      missingOptionalFields: missingOptionalFields,
      missingContactNumber: missingContactNumber,
      missingEducationBackground: missingEducationBackground,
      missingWorkStatus: missingWorkStatus,
      duplicateRiskCount: duplicateRiskCount,
      incompleteConsentCount: incompleteConsentCount,
    },
    insights,
  };
}
