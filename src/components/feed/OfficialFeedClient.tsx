"use client";

import { useEffect, useState } from "react";
import FeedPostCard, { FeedPost } from "@/components/feed/FeedPostCard";

export default function OfficialFeedClient({ canManage = false }: { canManage?: boolean }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try { const response = await fetch("/api/feed/posts", { cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Unable to load feed."); setPosts(payload.posts ?? []); setError(null); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load feed."); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  return <section className="space-y-4">{loading ? <p className="rounded-2xl border border-dashed border-glass-border p-5 text-sm text-muted">Loading feed...</p> : error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-5 text-sm text-rose-500">{error}</p> : posts.length === 0 ? <p className="rounded-2xl border border-dashed border-glass-border p-5 text-sm text-muted">No feed posts yet.</p> : posts.map((post) => <FeedPostCard key={post.id} post={post} canDelete={canManage && post.author.role !== "OFFICIAL"} onChanged={() => void load()} />)}</section>;
}
