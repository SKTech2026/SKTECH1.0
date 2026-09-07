"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type NewsPost = { id: string; title: string; content: string | null; imageUrl: string | null; createdAt: string; authorName: string };

export default function PublicNewsFeed() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { fetch("/api/public-news", { cache: "no-store" }).then((response) => response.ok ? response.json() : { posts: [] }).then((payload) => setPosts(payload.posts ?? [])).catch(() => setPosts([])).finally(() => setLoaded(true)); }, []);
  return <section id="news" className="bg-[#f6f9ff] px-4 py-16 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#1452d9]">SKTECH News</p><h2 className="mt-3 text-4xl font-black text-[#06132d] sm:text-5xl">Updates from the federation.</h2><p className="mt-4 text-base leading-7 text-[#24385f]/70">Published public notices from SKTECH administration.</p></div>{loaded && posts.length === 0 ? <p className="mt-8 rounded-2xl border border-dashed border-[#bfd1f8] bg-white p-5 text-sm text-[#24385f]/70">No public news has been published yet.</p> : <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl border border-[#dbe7ff] bg-white shadow-[0_18px_40px_-28px_rgba(6,19,45,0.65)]">{post.imageUrl ? <div className="relative aspect-[16/9]"><Image src={post.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /></div> : null}<div className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1452d9]">Posted by {post.authorName}</p><h3 className="mt-2 text-xl font-black text-[#06132d]">{post.title}</h3>{post.content ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#24385f]/70">{post.content}</p> : null}<time className="mt-4 block text-xs text-[#24385f]/50">{new Date(post.createdAt).toLocaleDateString()}</time></div></article>)}</div>}</div></section>;
}
