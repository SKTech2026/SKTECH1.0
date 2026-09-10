"use client";

import { useEffect, useState } from "react";
import FeedPostCard, { FeedPost } from "@/components/feed/FeedPostCard";

export default function OfficialFeedClient({ canManage = false }: { canManage?: boolean }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/feed/posts?take=10", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load feed.");
      setPosts(payload.posts ?? []);
      setNextCursor(payload.nextCursor ?? null);
      setHasMore(Boolean(payload.hasMore));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load feed.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/feed/posts?take=10&cursor=${encodeURIComponent(nextCursor)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load more posts.");
      setPosts((currentPosts) => {
        const existingIds = new Set(currentPosts.map((post) => post.id));
        return [...currentPosts, ...(payload.posts ?? []).filter((post: FeedPost) => !existingIds.has(post.id))];
      });
      setNextCursor(payload.nextCursor ?? null);
      setHasMore(Boolean(payload.hasMore));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load more posts.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { void load(); }, []);
  return <section className="space-y-4">
    <p className="px-1 text-xs text-muted">Showing latest SKTECH updates</p>
    {loading ? <p className="rounded-2xl border border-dashed border-glass-border p-5 text-sm text-muted">Loading feed...</p> : error && posts.length === 0 ? <p className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-5 text-sm text-rose-500">{error}</p> : posts.length === 0 ? <p className="rounded-2xl border border-dashed border-glass-border p-5 text-sm text-muted">No feed posts yet.</p> : <>
      {posts.map((post) => <FeedPostCard key={post.id} post={post} canDelete={canManage && post.author.role !== "OFFICIAL"} onChanged={() => void load()} />)}
      {error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-500">{error}</p> : null}
      {hasMore ? <div className="flex justify-center pt-1"><button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="rounded-xl border border-glass-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60">{loadingMore ? "Loading more..." : "Load more posts"}</button></div> : <p className="py-2 text-center text-xs font-semibold text-muted">You&apos;re all caught up.</p>}
    </>}
  </section>;
}
