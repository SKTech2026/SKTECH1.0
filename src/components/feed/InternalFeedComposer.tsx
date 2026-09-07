"use client";

import { FormEvent, useRef, useState } from "react";
import { ImagePlus, Send } from "lucide-react";

export default function InternalFeedComposer() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(null); setError(null);
    try { const body = new FormData(); body.set("content", content); if (image) body.set("image", image); const response = await fetch("/api/feed/posts", { method: "POST", body }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Unable to publish post."); setContent(""); setImage(null); if (inputRef.current) inputRef.current.value = ""; setMessage("Post published to the internal feed."); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to publish post."); } finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="rounded-2xl border border-glass-border bg-surface p-4 shadow-[0_18px_40px_-26px_var(--shadow-color)] sm:p-5">{message ? <p className="mb-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">{message}</p> : null}{error ? <p className="mb-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p> : null}<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={3} placeholder="Share an update with eligible officials..." className="w-full resize-y rounded-xl border border-glass-border bg-surface-elevated/50 px-3 py-3 text-sm text-foreground outline-none" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="hidden" /><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-muted hover:bg-surface-elevated"><ImagePlus className="h-4 w-4" />{image ? image.name : "Add pubmat"}</button>{image ? <button type="button" onClick={() => { setImage(null); if (inputRef.current) inputRef.current.value = ""; }} className="text-xs text-rose-500">Remove</button> : null}</div><button type="submit" disabled={saving || (!content.trim() && !image)} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground disabled:opacity-50"><Send className="h-4 w-4" />{saving ? "Posting..." : "Post update"}</button></div></form>;
}
