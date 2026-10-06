import Link from "next/link";
import { getActiveInvitation } from "@/lib/kk";
import JoinForm from "./join-form";

export const dynamic = "force-dynamic";

export default async function KKJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invitation = await getActiveInvitation(code);
  if (!invitation) return <main className="mx-auto max-w-xl px-5 py-20"><h1 className="text-3xl font-bold">Invitation unavailable</h1><p className="mt-3 text-muted">Ask your SK Chairperson for a new link.</p></main>;
  return <main className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">SKTECH · Katipunan ng Kabataan</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Welcome to Barangay {invitation.barangay.name} KK Portal</h1>
      <p className="mt-3 text-muted">{invitation.municipality.name}, {invitation.municipality.province}. Verify your email before creating your member profile.</p>
      <div className="mt-8"><JoinForm code={code} /></div>
      <p className="mt-7 text-sm text-muted">Your profile is visible only to you and the authorized SK Chairperson for your barangay. Optional reporting uses aggregate counts. <Link className="underline" href="/kk/login">Already registered? Sign in</Link></p>
    </div>
  </main>;
}
