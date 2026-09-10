"use client";

import Image from "next/image";
import { Heart, MessageCircle, MoreHorizontal, Send, ThumbsUp, X } from "lucide-react";
import { useEffect, useState } from "react";

type FeedComment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; photoUrl: string | null };
};

export type FeedPost = {
  id: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  author: { id: string; name: string; role: string; photoUrl: string | null; position: string | null; barangay: string | null; municipality: string | null };
  municipality: string | null;
  reactionCount: number;
  currentReaction: "LIKE" | "HEART" | "SUPPORT" | null;
  comments: FeedComment[];
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SK";
}

function Avatar({ name, photoUrl, className = "h-10 w-10" }: { name: string; photoUrl: string | null; className?: string }) {
  return <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1452d9]/15 text-xs font-black text-[#1452d9] ${className}`}><span>{initials(name)}</span>{photoUrl ? <Image src={photoUrl} alt="" fill className="object-cover" sizes="40px" /> : null}</div>;
}

export default function FeedPostCard({ post, canDelete = false, onChanged }: { post: FeedPost; canDelete?: boolean; onChanged: () => void }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  useEffect(() => {
    if (!photoViewerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPhotoViewerOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photoViewerOpen]);

  const react = async (type: "LIKE" | "HEART" | "SUPPORT") => {
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/feed/posts/${post.id}/reactions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to update reaction.");
      onChanged();
    } catch (reactionError) { setError(reactionError instanceof Error ? reactionError.message : "Unable to update reaction."); } finally { setBusy(false); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/feed/posts/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: comment }) });
      if (!response.ok) throw new Error((await response.json()).error ?? "Unable to add comment.");
      setComment(""); onChanged();
    } catch (commentError) { setError(commentError instanceof Error ? commentError.message : "Unable to add comment."); } finally { setBusy(false); }
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    setBusy(true);
    try { const response = await fetch(`/api/feed/posts/${post.id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Unable to delete post."); onChanged(); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete post."); } finally { setBusy(false); }
  };

  return <article className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-[0_18px_40px_-26px_var(--shadow-color)]">
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <Avatar name={post.author.name} photoUrl={post.author.photoUrl} />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{post.author.name}</p><p className="mt-0.5 text-xs text-muted">{post.author.role === "ADMIN" ? "SKTECH Admin" : "Municipal Staff"}{post.municipality ? ` · ${post.municipality}` : " · Province-wide"}{post.author.barangay ? ` · Barangay ${post.author.barangay}` : ""}</p><time className="mt-1 block text-[11px] text-muted">{new Date(post.createdAt).toLocaleString()}</time></div>
      {canDelete ? <button type="button" onClick={() => void deletePost()} disabled={busy} aria-label="Post actions" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-elevated hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button> : null}
    </div>
    {post.content ? <p className="whitespace-pre-wrap break-words px-4 pb-4 text-sm leading-6 text-foreground sm:px-5">{post.content}</p> : null}
    {post.imageUrl && !imageError ? <button type="button" onClick={() => setPhotoViewerOpen(true)} aria-label="View full photo" className="group relative block aspect-[16/10] w-full cursor-pointer bg-surface-elevated text-left"><img src={post.imageUrl} alt="Feed pubmat" className="h-full w-full object-cover transition group-hover:brightness-95" onError={() => setImageError(true)} /></button> : null}
    {post.imageUrl && imageError ? <p className="px-4 py-3 text-xs text-muted sm:px-5">Image unavailable</p> : null}
    <div className="flex items-center justify-between border-b border-glass-border px-4 py-3 text-xs text-muted sm:px-5"><span>{post.reactionCount} reaction{post.reactionCount === 1 ? "" : "s"}</span><button type="button" onClick={() => setCommentsOpen((open) => !open)} className="inline-flex items-center gap-1 hover:text-foreground"><MessageCircle className="h-3.5 w-3.5" />{post.comments.length} comment{post.comments.length === 1 ? "" : "s"}</button></div>
    <div className="grid grid-cols-3 gap-1 p-2"><button type="button" disabled={busy} onClick={() => void react("LIKE")} className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold ${post.currentReaction === "LIKE" ? "bg-[#1452d9]/15 text-[#1452d9]" : "text-muted hover:bg-surface-elevated"}`}><ThumbsUp className="h-3.5 w-3.5" />Like</button><button type="button" disabled={busy} onClick={() => void react("HEART")} className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold ${post.currentReaction === "HEART" ? "bg-rose-500/15 text-rose-500" : "text-muted hover:bg-surface-elevated"}`}><Heart className="h-3.5 w-3.5" />Heart</button><button type="button" disabled={busy} onClick={() => setCommentsOpen(true)} className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-muted hover:bg-surface-elevated"><MessageCircle className="h-3.5 w-3.5" />Comment</button></div>
    {commentsOpen ? <div className="space-y-3 border-t border-glass-border px-4 py-4 sm:px-5">{post.comments.map((item) => <div key={item.id} className="flex gap-2"><Avatar name={item.author.name} photoUrl={item.author.photoUrl} className="h-7 w-7" /><div className="min-w-0 rounded-xl bg-surface-elevated/60 px-3 py-2"><p className="text-xs font-bold text-foreground">{item.author.name}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted">{item.content}</p></div></div>)}<div className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addComment(); }} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-full border border-glass-border bg-surface-elevated px-3 py-2 text-xs text-foreground outline-none" /><button type="button" onClick={() => void addComment()} disabled={busy || !comment.trim()} aria-label="Send comment" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" /></button></div></div> : null}
    {error ? <p className="px-4 pb-4 text-xs text-rose-500 sm:px-5">{error}</p> : null}
    {photoViewerOpen && post.imageUrl && !imageError ? <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Full feed photo" onClick={(event) => { if (event.target === event.currentTarget) setPhotoViewerOpen(false); }}><div className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 shadow-2xl"><button type="button" onClick={() => setPhotoViewerOpen(false)} autoFocus aria-label="Close full photo" className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"><X className="h-5 w-5" /></button><div className="flex min-h-0 items-center justify-center p-3 sm:p-6"><img src={post.imageUrl} alt="Feed pubmat full size" className="max-h-[75vh] w-full object-contain" /></div>{post.content ? <p className="max-h-24 overflow-y-auto border-t border-white/10 px-4 py-3 text-sm leading-6 text-white/80 sm:px-6">{post.content}</p> : null}</div></div> : null}
  </article>;
}
