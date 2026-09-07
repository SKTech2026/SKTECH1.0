"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Megaphone } from "lucide-react";

export default function StaffAnnouncementComposer() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setMessage(null); setError(null);
    try {
      const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, eventDate }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to publish announcement.");
      setTitle(""); setDescription(""); setEventDate(""); setMessage("Announcement published to your municipality feed.");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to publish announcement."); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Link href="/mobile/staff" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground"><ArrowLeft className="h-4 w-4" />Back to Staff Dashboard</Link>
      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl"><p className="text-[11px] uppercase tracking-[0.16em] text-accent">Municipality Feed</p><h1 className="mt-1 text-xl font-bold text-foreground">Post Announcement / Pubmat</h1><p className="mt-1 text-sm text-muted">Publish a text announcement for SK Officials in your assigned municipality.</p></section>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-glass-border bg-surface p-4">
        {message ? <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p> : null}{error ? <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}
        <label className="block text-sm font-semibold text-foreground">Title<input value={title} onChange={(event) => setTitle(event.target.value)} required className="mt-1.5 h-11 w-full rounded-xl border border-glass-border bg-surface-elevated px-3 text-sm text-foreground" /></label>
        <label className="block text-sm font-semibold text-foreground">Message / caption<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="mt-1.5 w-full rounded-xl border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground" /></label>
        <label className="block text-sm font-semibold text-foreground">Publish date<input type="datetime-local" value={eventDate} onChange={(event) => setEventDate(event.target.value)} required className="mt-1.5 h-11 w-full rounded-xl border border-glass-border bg-surface-elevated px-3 text-sm text-foreground" /></label>
        <p className="rounded-xl border border-dashed border-glass-border p-3 text-xs text-muted"><Megaphone className="mr-1 inline h-4 w-4 text-accent" />Image/pubmat upload is not available in the existing announcement storage, so this composer publishes text-only posts.</p>
        <button type="submit" disabled={saving} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-60">{saving ? "Publishing..." : "Publish Announcement"}</button>
      </form>
    </div>
  );
}
