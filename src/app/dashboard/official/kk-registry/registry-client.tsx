"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Invitation = { path: string; expiresAt: string };
type Profile = { id: string; firstName: string; middleName: string | null; lastName: string; suffix: string | null; age: number | null; sexAssignedAtBirth: string | null; status: string; civilStatus: string | null; educationalBackground: string | null; youthClassification: string | null; specificNeedsCategory: string | null; workStatus: string | null; registeredSkVoter: boolean | null; attendedKkAssembly: boolean | null; createdAt: string };

export default function RegistryClient({ initialInvitations, initialProfiles }: { initialInvitations: Invitation[]; initialProfiles: Profile[] }) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [busy, setBusy] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function createInvite() {
    setBusy("invite"); setError(""); setMessage("");
    try { const response = await fetch("/api/kk/invitations", { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not create invitation."); setInvitations(current => [{ path: data.path, expiresAt: data.expiresAt }, ...current].slice(0, 5)); setMessage("Invitation created. Copy the link to share it with barangay youth."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create invitation."); }
    finally { setBusy(""); }
  }
  async function review(id: string, status: string) {
    setBusy(id); setError(""); setMessage("");
    try { const response = await fetch("/api/kk/registry", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Review failed."); setProfiles(current => current.map(profile => profile.id === id ? { ...profile, status } : profile)); setMessage("Profile status updated."); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Review failed."); }
    finally { setBusy(""); }
  }
  const counts = profiles.reduce<Record<string, number>>((result, profile) => { result[profile.status] = (result[profile.status] ?? 0) + 1; return result; }, {});
  return <div className="space-y-7">
    <section className="rounded-3xl border border-border bg-surface p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Invitation links</h2><p className="text-sm text-muted">Links expire after 30 days and remain tied to this barangay.</p></div><button onClick={createInvite} disabled={Boolean(busy)} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Create invitation</button></div><div className="mt-4 space-y-2">{invitations.length ? invitations.map(item => <div key={item.path} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3"><span className="min-w-0 flex-1 truncate text-sm">{item.path}</span><button className="rounded-lg border border-border px-3 py-2 text-sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}${item.path}`).then(() => setMessage("Link copied.")).catch(() => setError("Copy failed. Select the link instead."))}>Copy</button><span className="text-xs text-muted">Expires {new Date(item.expiresAt).toLocaleDateString()}</span></div>) : <p className="text-sm text-muted">No active invitations yet.</p>}</div></section>
    <section className="rounded-3xl border border-border bg-surface p-6"><h2 className="text-xl font-semibold">Aggregate status counts</h2><div className="mt-4 flex flex-wrap gap-3">{Object.keys(counts).length ? Object.entries(counts).map(([status, count]) => <span key={status} className="rounded-full border border-border px-4 py-2 text-sm">{status.replaceAll("_", " ")}: {count}</span>) : <p className="text-sm text-muted">No KK profiles yet.</p>}</div><p className="mt-2 text-xs text-muted">This page shows the latest 100 profiles; use the aggregate API for full counts.</p></section>
    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}{error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <section className="space-y-4"><h2 className="text-xl font-semibold">Barangay profiles</h2>{profiles.length ? profiles.map(profile => <article key={profile.id} className="rounded-2xl border border-border bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{[profile.firstName, profile.middleName, profile.lastName, profile.suffix].filter(Boolean).join(" ")}</h3><p className="text-sm text-muted">Age {profile.age ?? "—"} · {profile.sexAssignedAtBirth ?? "—"} · {profile.status.replaceAll("_", " ")}</p></div><span className="text-xs text-muted">Submitted {new Date(profile.createdAt).toLocaleDateString()}</span></div><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div>Classification: {profile.youthClassification ?? "—"}</div><div>Education: {profile.educationalBackground ?? "—"}</div><div>Work: {profile.workStatus ?? "—"}</div><div>Civil status: {profile.civilStatus ?? "—"}</div><div>Specific needs: {profile.specificNeedsCategory ?? "—"}</div><div>SK voter: {profile.registeredSkVoter === null ? "—" : profile.registeredSkVoter ? "Yes" : "No"}</div><div>KK assembly: {profile.attendedKkAssembly === null ? "—" : profile.attendedKkAssembly ? "Yes" : "No"}</div></dl>{profile.status === "PENDING_VERIFICATION" && <div className="mt-5 flex flex-wrap gap-2">{[["VERIFIED", "Verify"], ["NEEDS_CORRECTION", "Needs correction"], ["REJECTED", "Reject"]].map(([status, label]) => <button key={status} disabled={Boolean(busy)} onClick={() => review(profile.id, status)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">{label}</button>)}</div>}{["VERIFIED", "NEEDS_CORRECTION", "REJECTED"].includes(profile.status) && <button disabled={Boolean(busy)} onClick={() => review(profile.id, "ARCHIVED")} className="mt-5 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-50">Archive</button>}</article>) : <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">No registered KK members yet.</div>}</section>
  </div>;
}
