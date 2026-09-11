"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImagePlus, Send } from "lucide-react";

type NewsPost = {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  published: boolean;
  createdAt: string;
};

export default function PublicNewsAdminClient() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch("/api/admin/public-news", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setPosts(payload.posts ?? []);
    else setError(payload.error ?? "Unable to load public news.");
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const body = new FormData();
      body.set("title", title);
      body.set("content", content);
      body.set("published", String(published));
      if (image) body.set("image", image);

      const response = await fetch("/api/admin/public-news", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to publish news.");

      setTitle("");
      setContent("");
      setImage(null);
      setMessage("Public news saved.");
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save public news.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (post: NewsPost) => {
    const body = new FormData();
    body.set("published", String(!post.published));
    await fetch(`/api/admin/public-news/${post.id}`, { method: "PATCH", body });
    await load();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl sm:p-5">
        {message ? <p className="mb-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">{message}</p> : null}
        {error ? <p className="mb-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p> : null}
        <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="News title" className="h-11 w-full rounded-xl border border-glass-border bg-surface-elevated px-3 text-sm text-foreground" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} placeholder="Public news caption..." className="mt-3 w-full rounded-xl border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
            <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Publish publicly
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-muted">
            <ImagePlus className="h-4 w-4" />
            <span>{image ? image.name : "Add pubmat"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="hidden" />
          </label>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground disabled:opacity-50">
            <Send className="h-4 w-4" />{busy ? "Saving..." : "Save news"}
          </button>
        </div>
      </form>
      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-glass-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">{post.title}</h3>
                <p className="mt-1 text-xs text-muted">{post.published ? "Published publicly" : "Unpublished"} · {new Date(post.createdAt).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => void toggle(post)} className="rounded-lg border border-glass-border px-2 py-1 text-xs text-muted">
                {post.published ? "Unpublish" : "Publish"}
              </button>
            </div>
            {post.content ? <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{post.content}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
