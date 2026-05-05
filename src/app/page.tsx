"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLoginActions, setShowLoginActions] = useState(false);
  const getStartedAudioRef = useRef<HTMLAudioElement | null>(null);
  const loginSelectAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isDarkTheme = mounted ? resolvedTheme === "dark" : false;

  const onGetStarted = () => {
    setShowLoginActions(true);
    const audio = getStartedAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Playback may fail until browser allows media after user interaction.
    });
  };

  const onLoginSelect = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    event.preventDefault();
    const audio = loginSelectAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      void audio.play().catch(() => {
        // Ignore playback restrictions.
      });
    }
    window.setTimeout(() => {
      router.push(href);
    }, 120);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 transition-colors duration-500">
      <Image
        src="/illustrations/light.svg"
        alt="SKTech landing background light"
        fill
        priority
        sizes="100vw"
        className={`object-cover object-center transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDarkTheme
            ? "opacity-0 scale-[1.04] blur-[1.2px] saturate-[0.9]"
            : "opacity-100 scale-100 blur-0 saturate-[1.07]"
        }`}
      />
      <Image
        src="/illustrations/dark.svg"
        alt="SKTech landing background dark"
        fill
        priority
        sizes="100vw"
        className={`object-cover object-center transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDarkTheme
            ? "opacity-100 scale-100 blur-0 saturate-[1.18] contrast-[1.12]"
            : "opacity-0 scale-[1.04] blur-[1.2px] saturate-[0.92]"
        }`}
      />

      <div
        className={`pointer-events-none absolute inset-0 transition-[background,opacity] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDarkTheme
            ? "bg-[radial-gradient(circle_at_15%_14%,rgba(56,189,248,0.20),transparent_38%),radial-gradient(circle_at_85%_18%,rgba(59,130,246,0.16),transparent_42%),linear-gradient(135deg,rgba(2,6,23,0.30),rgba(2,6,23,0.62))]"
            : "bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.18),transparent_42%),linear-gradient(120deg,rgba(248,250,252,0.30),rgba(248,250,252,0.16))]"
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDarkTheme
            ? "opacity-100 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(2,6,23,0.68)_100%)]"
            : "opacity-100 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(148,163,184,0.22)_100%)]"
        }`}
      />

      <ThemeToggle className="absolute left-4 top-4 z-30 sm:left-6 sm:top-6" />
      <audio ref={getStartedAudioRef} preload="auto" src="/sounds/e-1.mp3" />
      <audio ref={loginSelectAudioRef} preload="auto" src="/sounds/e-2.mp3" />

      <main className="relative z-20 flex min-h-screen items-center px-4 py-10 sm:px-8 lg:px-16">
        <article
          className={`w-full max-w-xl rounded-[28px] p-6 transition-all duration-500 sm:p-8 ${
            isDarkTheme
              ? "bg-slate-900/68 text-slate-100 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl"
              : "bg-white/88 text-slate-900 shadow-[0_30px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm"
          }`}
        >
          <div className="text-center">
            <div className="group relative mx-auto mb-4 w-fit">
              <div className="relative overflow-hidden rounded-3xl">
                <Image
                  src="/login-logo.png"
                  alt="SKTech logo"
                  width={360}
                  height={360}
                  priority
                  className={`h-[170px] w-[170px] object-contain transition duration-300 group-hover:scale-105 sm:h-[240px] sm:w-[240px] ${
                    isDarkTheme
                      ? "drop-shadow-[0_0_18px_rgba(56,189,248,0.6)] group-hover:drop-shadow-[0_0_26px_rgba(56,189,248,0.85)]"
                      : "drop-shadow-md group-hover:drop-shadow-[0_0_18px_rgba(37,99,235,0.45)]"
                  }`}
                />
                <span className="pointer-events-none absolute inset-0 -translate-x-[145%] bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-[145%]" />
              </div>
            </div>
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                isDarkTheme ? "text-cyan-300" : "text-blue-700"
              }`}
            >
              SK Provincial Federation
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              WELCOME TO SKTECH
            </h1>
          </div>

          <p className={`mt-4 text-sm sm:text-base ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
            SK Provincial Federation Integrated E-Governance System
          </p>

          <div className="mt-6">
            {!showLoginActions ? (
              <button
                type="button"
                onClick={onGetStarted}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isDarkTheme
                    ? "bg-cyan-500/90 text-slate-950 hover:bg-cyan-400 hover:shadow-[0_0_22px_rgba(34,211,238,0.7)]"
                    : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.45)]"
                }`}
              >
                Get Started
              </button>
            ) : null}
          </div>

          <div
            className={`grid gap-3 transition-all duration-300 sm:grid-cols-3 ${
              showLoginActions
                ? "mt-6 max-h-40 opacity-100"
                : "pointer-events-none max-h-0 overflow-hidden opacity-0"
            }`}
          >
            <Link
              href="/official/auth"
              onClick={(event) => onLoginSelect(event, "/official/auth")}
              className="inline-flex items-center justify-center rounded-xl bg-[#b03333] px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[#9f2b2b] hover:shadow-[0_0_16px_rgba(176,51,51,0.45)]"
            >
              SK Official Login
            </Link>
            <Link
              href="/login?role=ADMIN"
              onClick={(event) => onLoginSelect(event, "/login?role=ADMIN")}
              className={`inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                isDarkTheme
                  ? "border-cyan-300/30 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Admin Login
            </Link>
            <Link
              href="/login?role=STAFF"
              onClick={(event) => onLoginSelect(event, "/login?role=STAFF")}
              className={`inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                isDarkTheme
                  ? "border-cyan-300/30 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Staff Login
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
