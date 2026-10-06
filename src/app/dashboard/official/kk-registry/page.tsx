import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getChairScope } from "@/lib/kk";
import RegistryClient from "./registry-client";

export const dynamic = "force-dynamic";

export default async function KKRegistryPage() {
  const scope = await getChairScope();
  if (!scope) redirect("/unauthorized");
  const [barangay, invitations, profiles] = await Promise.all([
    prisma.barangay.findUnique({ where: { id: scope.barangayId }, select: { name: true, municipality: { select: { name: true } } } }),
    prisma.kKInvitation.findMany({ where: { createdById: scope.userId, barangayId: scope.barangayId, municipalityId: scope.municipalityId, active: true, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, take: 5, select: { code: true, expiresAt: true } }),
    prisma.kKMemberProfile.findMany({ where: { barangayId: scope.barangayId, municipalityId: scope.municipalityId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, firstName: true, middleName: true, lastName: true, suffix: true, age: true, sexAssignedAtBirth: true, status: true, civilStatus: true, educationalBackground: true, youthClassification: true, specificNeedsCategory: true, workStatus: true, registeredSkVoter: true, attendedKkAssembly: true, createdAt: true } }),
  ]);
  if (!barangay) redirect("/unauthorized");
  return <section className="space-y-7"><div className="rounded-3xl border border-border bg-surface p-6 sm:p-9"><p className="text-sm font-bold uppercase tracking-widest text-accent">SK Chairperson · KK Registry</p><h1 className="mt-3 text-3xl font-bold">Barangay {barangay.name}</h1><p className="mt-2 text-muted">{barangay.municipality.name}. Only profiles linked to your assigned barangay appear here.</p><p className="mt-3 text-sm text-muted">Profile details are for verification only. Share aggregate counts, not individual records.</p></div><RegistryClient initialInvitations={invitations.map(item => ({ path: `/kk/join/${item.code}`, expiresAt: item.expiresAt.toISOString() }))} initialProfiles={profiles.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }))} /></section>;
}
