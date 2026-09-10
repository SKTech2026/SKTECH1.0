"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, X } from "lucide-react";

type NewsPost = {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  authorName: string;
};

const AUTOPLAY_DELAY_MS = 6500;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function excerpt(value: string | null, maxLength = 180) {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return "Open this published SKTECH update for more details.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function PublicNewsFeed() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch("/api/public-news", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load public updates.");
        return (await response.json()) as { posts?: NewsPost[] };
      })
      .then((payload) => {
        if (!mounted) return;
        setPosts(Array.isArray(payload.posts) ? payload.posts : []);
        setActiveIndex(0);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setPosts([]);
        setError("Public updates are temporarily unavailable.");
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (paused || selectedPost || posts.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % posts.length);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(interval);
  }, [paused, posts.length, selectedPost]);

  useEffect(() => {
    if (!selectedPost) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPost(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPost]);

  const displayIndex = posts.length > 0 ? activeIndex % posts.length : 0;
  const activePost = posts[displayIndex] ?? null;
  const hasMultiplePosts = posts.length > 1;
  const displayDate = useMemo(
    () => (activePost ? formatDate(activePost.createdAt) : ""),
    [activePost],
  );

  const goToPrevious = () => {
    if (!posts.length) return;
    setActiveIndex((current) => (current - 1 + posts.length) % posts.length);
  };

  const goToNext = () => {
    if (!posts.length) return;
    setActiveIndex((current) => (current + 1) % posts.length);
  };

  return (
    <section id="news" className="bg-[#f6f9ff] px-4 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1452d9]">
              Public Updates
            </p>
            <h2 className="mt-3 text-4xl font-black text-[#06132d] sm:text-5xl">
              SKTECH News & Public Updates
            </h2>
            <p className="mt-4 text-base leading-7 text-[#24385f]/70">
              Latest published announcements and updates from SKTECH.
            </p>
          </div>
          {posts.length > 0 ? (
            <div className="inline-flex w-fit rounded-full border border-[#bfd1f8] bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0a3aa2] shadow-sm">
              {displayIndex + 1} of {posts.length}
            </div>
          ) : null}
        </div>

        {!loaded ? (
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#dbe7ff] bg-white shadow-[0_28px_70px_-44px_rgba(6,19,45,0.75)]">
            <div className="grid min-h-[420px] animate-pulse gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="bg-[#dce8ff]" />
              <div className="space-y-5 p-6 sm:p-8 lg:p-10">
                <div className="h-4 w-36 rounded-full bg-[#dce8ff]" />
                <div className="h-12 max-w-lg rounded-2xl bg-[#dce8ff]" />
                <div className="h-24 max-w-xl rounded-2xl bg-[#eef4ff]" />
                <div className="h-11 w-36 rounded-full bg-[#bfd1f8]" />
              </div>
            </div>
          </div>
        ) : error ? (
          <p className="mt-8 rounded-2xl border border-[#ffd6dc] bg-white p-5 text-sm font-semibold text-[#8f1f2c]">
            {error}
          </p>
        ) : posts.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-[#bfd1f8] bg-white p-5 text-sm text-[#24385f]/70">
            No public updates yet.
          </p>
        ) : activePost ? (
          <div
            className="mt-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <article className="relative overflow-hidden rounded-[2rem] border border-[#dbe7ff] bg-[#06132d] shadow-[0_30px_80px_-44px_rgba(6,19,45,0.85)]">
              <button
                type="button"
                onClick={() => setSelectedPost(activePost)}
                className="group grid min-h-[460px] w-full text-left lg:grid-cols-[1.1fr_0.9fr]"
                aria-label={`Read update: ${activePost.title}`}
              >
                <div className="relative min-h-[250px] overflow-hidden bg-[linear-gradient(135deg,#06132d,#1452d9_54%,#cf2638)] lg:min-h-[460px]">
                  {activePost.imageUrl ? (
                    <Image
                      src={activePost.imageUrl}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      priority={displayIndex === 0}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(243,199,43,0.7),transparent_28%),radial-gradient(circle_at_78%_32%,rgba(207,38,56,0.48),transparent_30%),linear-gradient(135deg,#06132d,#0a3aa2_54%,#1452d9)]" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,19,45,0.22),rgba(6,19,45,0.68))]" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur">
                    Featured Update
                  </div>
                </div>

                <div className="relative flex min-h-[360px] flex-col justify-center overflow-hidden bg-[linear-gradient(145deg,#06132d,#092760_58%,#0a3aa2)] p-6 text-white sm:p-8 lg:p-10">
                  <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#f3c72b]/20 blur-3xl" />
                  <div className="absolute -bottom-28 left-8 h-60 w-60 rounded-full bg-[#cf2638]/25 blur-3xl" />
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-blue-100/80">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#f3c72b]" />
                        {displayDate}
                      </span>
                      {activePost.authorName ? (
                        <span className="rounded-full border border-white/15 px-3 py-1 text-white/75">
                          {activePost.authorName}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                      {activePost.title}
                    </h3>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-50/82 sm:text-base">
                      {excerpt(activePost.content)}
                    </p>
                    <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#0a3aa2] shadow-[0_18px_36px_-26px_rgba(255,255,255,0.75)] transition group-hover:bg-[#f3c72b] group-hover:text-[#06132d]">
                      Read update
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>

              {hasMultiplePosts ? (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-3 sm:px-5">
                  <button
                    type="button"
                    onClick={goToPrevious}
                    className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-[#06132d]/70 text-white shadow-lg backdrop-blur transition hover:bg-white hover:text-[#0a3aa2] focus:outline-none focus:ring-2 focus:ring-[#f3c72b]"
                    aria-label="Show previous public update"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-[#06132d]/70 text-white shadow-lg backdrop-blur transition hover:bg-white hover:text-[#0a3aa2] focus:outline-none focus:ring-2 focus:ring-[#f3c72b]"
                    aria-label="Show next public update"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
            </article>

            {hasMultiplePosts ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {posts.map((post, index) => {
                  const active = index === displayIndex;
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#1452d9] focus:ring-offset-2 ${
                        active ? "w-10 bg-[#1452d9]" : "w-3 bg-[#bfd1f8] hover:bg-[#6f92d3]"
                      }`}
                      aria-label={`Show public update ${index + 1}: ${post.title}`}
                      aria-current={active ? "true" : undefined}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedPost ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#06132d]/72 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-news-dialog-title"
        >
          <button
            type="button"
            aria-label="Close public update backdrop"
            onClick={() => setSelectedPost(null)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] border border-white/20 bg-white shadow-[0_32px_90px_-42px_rgba(0,0,0,0.9)]">
            {selectedPost.imageUrl ? (
              <div className="relative aspect-[16/8] min-h-[210px] overflow-hidden bg-[#06132d]">
                <Image
                  src={selectedPost.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,19,45,0.1),rgba(6,19,45,0.62))]" />
              </div>
            ) : (
              <div className="h-56 bg-[radial-gradient(circle_at_24%_20%,rgba(243,199,43,0.65),transparent_30%),radial-gradient(circle_at_80%_28%,rgba(207,38,56,0.46),transparent_32%),linear-gradient(135deg,#06132d,#1452d9)]" />
            )}
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-[#06132d]/75 text-white backdrop-blur transition hover:bg-white hover:text-[#0a3aa2] focus:outline-none focus:ring-2 focus:ring-[#f3c72b]"
              aria-label="Close public update"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.12em] text-[#1452d9]">
                <span>{formatDate(selectedPost.createdAt)}</span>
                {selectedPost.authorName ? (
                  <span className="rounded-full border border-[#dbe7ff] bg-[#f6f9ff] px-3 py-1 text-[#24385f]/70">
                    {selectedPost.authorName}
                  </span>
                ) : null}
              </div>
              <h3 id="public-news-dialog-title" className="mt-4 text-3xl font-black leading-tight text-[#06132d] sm:text-4xl">
                {selectedPost.title}
              </h3>
              {selectedPost.content ? (
                <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-[#24385f]/80">
                  {selectedPost.content}
                </p>
              ) : (
                <p className="mt-5 text-base leading-8 text-[#24385f]/70">
                  No additional details were provided for this update.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
