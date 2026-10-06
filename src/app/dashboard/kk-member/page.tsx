import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getKKUser } from "@/lib/kk";

export const dynamic = "force-dynamic";

export default async function KKDashboard() {
  const member = await getKKUser();
  if (!member) redirect("/kk/login");
  const profile = await prisma.kKMemberProfile.findUnique({ where: { userId: member.id }, select: { firstName: true, lastName: true, status: true, age: true, createdAt: true, municipality: { select: { name: true } }, barangay: { select: { name: true } } } });
  if (!profile) return <section className="rounded-2xl border border-border bg-surface p-6"><h1 className="text-2xl font-bold">Profile unavailable</h1><p className="mt-2 text-muted">Please contact your SK Chairperson.</p></section>;
  return <div className="space-y-6">
    <section className="rounded-3xl border border-border bg-surface p-6 sm:p-9"><p className="text-sm font-bold uppercase tracking-widest text-accent">My KK membership</p><h1 className="mt-3 text-3xl font-bold">Welcome, {profile.firstName}</h1><p className="mt-3 text-muted">{profile.barangay.name}, {profile.municipality.name}</p><p className="mt-5 inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold">Profile status: {profile.status.replaceAll("_", " ")}</p><p className="mt-4 text-sm text-muted">Only you and your authorized barangay SK Chairperson can access your individual profile.</p><Link href="/dashboard/kk-member/profile" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">KK Survey / Profiling</Link></section>
    <section className="rounded-3xl border border-border bg-surface p-6"><p className="text-sm font-bold uppercase tracking-widest text-accent">YouthPass foundation</p><h2 className="mt-3 text-xl font-semibold">{profile.firstName} {profile.lastName}</h2><p className="mt-1 text-muted">Barangay {profile.barangay.name} · {profile.municipality.name}</p><p className="mt-4 text-sm">{profile.status === "VERIFIED" ? "Verified KK profile" : "YouthPass is available after profile verification."}</p><p className="mt-2 text-xs text-muted">This private preview is not a public identity verification document.</p></section>
  </div>;
}
