import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getKKUser } from "@/lib/kk";
import ProfileForm from "./profile-form";

export const dynamic = "force-dynamic";

export default async function KKProfilePage() {
  const member = await getKKUser();
  if (!member) redirect("/kk/login");
  const profile = await prisma.kKMemberProfile.findUnique({ where: { userId: member.id }, include: { municipality: { select: { name: true, province: true } }, barangay: { select: { name: true } } } });
  if (!profile) return <p className="rounded-xl border border-border p-6">Profile unavailable. Contact your SK Chairperson.</p>;
  const editable = profile.status === "DRAFT" || profile.status === "NEEDS_CORRECTION";
  const initial = {
    firstName: profile.firstName, lastName: profile.lastName, middleName: profile.middleName ?? "", suffix: profile.suffix ?? "",
    region: profile.region ?? "MIMAROPA", province: profile.province ?? profile.municipality.province, purokZone: profile.purokZone ?? "",
    sexAssignedAtBirth: profile.sexAssignedAtBirth ?? "", birthdate: profile.birthdate?.toISOString().slice(0, 10) ?? "",
    contactNumber: profile.contactNumber ?? "", civilStatus: profile.civilStatus ?? "", educationalBackground: profile.educationalBackground ?? "",
    youthClassification: profile.youthClassification ?? "", specificNeedsCategory: profile.specificNeedsCategory ?? "", workStatus: profile.workStatus ?? "",
    registeredSkVoter: profile.registeredSkVoter === null ? "" : String(profile.registeredSkVoter),
    registeredNationalVoter: profile.registeredNationalVoter === null ? "" : String(profile.registeredNationalVoter),
    votedLastElection: profile.votedLastElection === null ? "" : String(profile.votedLastElection),
    attendedKkAssembly: profile.attendedKkAssembly === null ? "" : String(profile.attendedKkAssembly),
    kkAssemblyAttendanceFrequency: profile.kkAssemblyAttendanceFrequency ?? "", noKkAssemblyReason: profile.noKkAssemblyReason ?? "",
    dataPrivacyConsent: profile.dataPrivacyConsent, profilingConsent: profile.profilingConsent,
    aggregateReportingConsent: profile.aggregateReportingConsent, communicationConsent: profile.communicationConsent,
  };
  return <section className="rounded-3xl border border-border bg-surface p-6 sm:p-9"><p className="text-sm font-bold uppercase tracking-widest text-accent">KK Survey / Profiling</p><h1 className="mt-3 text-3xl font-bold">Your barangay profile</h1><p className="mt-3 text-muted">Status: {profile.status.replaceAll("_", " ")}. Municipality and barangay are locked to your invitation.</p><div className="mt-8"><ProfileForm initial={initial} email={member.email ?? ""} municipality={profile.municipality.name} barangay={profile.barangay.name} editable={editable} /></div></section>;
}
