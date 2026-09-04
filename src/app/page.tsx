"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  IdCard,
  MessageSquareLock,
  QrCode,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";

const coreFeatures = [
  {
    title: "SK Official Profiling",
    description:
      "Keeps verified official records organized for faster review, updates, and accountability.",
    Icon: UsersRound,
  },
  {
    title: "Digital ID",
    description:
      "Provides a consistent credential view for approved officials using the existing SKTECH record.",
    Icon: IdCard,
  },
  {
    title: "QR / Face Attendance",
    description:
      "Supports event attendance workflows with QR scanning and face verification where enabled.",
    Icon: QrCode,
  },
  {
    title: "Announcements",
    description:
      "Publishes federation and municipal updates in one accessible channel for officials and staff.",
    Icon: Bell,
  },
  {
    title: "Event Management",
    description:
      "Helps manage activities, schedules, participation, and supporting event details.",
    Icon: CalendarDays,
  },
  {
    title: "Municipality-Restricted Chat",
    description:
      "Keeps coordination focused within the appropriate municipality and authorized users.",
    Icon: MessageSquareLock,
  },
  {
    title: "Mobile / PWA Access",
    description:
      "Gives officials and staff a phone-ready experience for field and on-site workflows.",
    Icon: Smartphone,
  },
  {
    title: "Analytics",
    description:
      "Turns program data into clearer activity, attendance, and participation summaries.",
    Icon: BarChart3,
  },
];

const howItWorks = [
  "Register",
  "Verification",
  "Official Dashboard",
  "Digital ID",
  "Announcements / Events",
  "Attendance",
  "Secure Municipality Communication",
];

const intendedUsers = [
  "SK Officials",
  "Municipal Staff",
  "SK Provincial Federation / Authorized Administrators",
];

const objectives = [
  "Reduce manual processes in SK records and activity tracking.",
  "Centralize official profiles, announcements, events, and attendance.",
  "Support transparency through cleaner records and consistent access.",
  "Improve coordination among SK councils and municipal staff.",
  "Make key workflows more accessible through mobile-ready tools.",
  "Advance youth governance digital transformation through a practical prototype.",
];

const technologies = [
  "Next.js",
  "PostgreSQL / Supabase",
  "QR Technology",
  "Facial Recognition / Liveness",
  "Mobile PWA",
  "Cloud Deployment",
  "Secure Document Sharing",
];

const securityHighlights = [
  "Role-based access",
  "Municipality restrictions",
  "Encrypted facial embeddings",
  "Secure authentication",
  "Private document storage",
  "Server-side authorization",
];

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
  const panelClass = isDarkTheme
    ? "bg-slate-900/68 text-slate-100 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl"
    : "bg-white/88 text-slate-900 shadow-[0_30px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm";
  const mutedTextClass = isDarkTheme ? "text-slate-300" : "text-slate-600";
  const subtleTextClass = isDarkTheme ? "text-slate-400" : "text-slate-500";
  const borderClass = isDarkTheme ? "border-white/10" : "border-slate-200/80";
  const chipClass = isDarkTheme
    ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
    : "border-blue-200 bg-blue-50 text-blue-800";

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
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 transition-colors duration-500">
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
          className={`w-full max-w-xl rounded-[28px] p-6 transition-all duration-500 sm:p-8 ${panelClass}`}
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

          <p className={`mt-4 text-sm leading-6 sm:text-base ${mutedTextClass}`}>
            A digital coordination platform for verified SK officials, helping
            councils manage records, IDs, events, attendance, and local
            communication with clearer accountability.
          </p>

          <div className="mt-5 grid gap-2 text-left sm:grid-cols-3">
            {["Secure access", "Mobile ready", "Council focused"].map((item) => (
              <span
                key={item}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${chipClass}`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>

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
            className={`grid gap-3 transition-all duration-300 ${
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
          </div>
        </article>
      </main>

      <section className="relative z-20 px-4 pb-10 sm:px-8 lg:px-16">
        <div className="mx-auto grid w-full max-w-6xl gap-6">
          <article className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                isDarkTheme ? "text-cyan-300" : "text-blue-700"
              }`}
            >
              About SKTECH
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Built for clearer youth governance workflows.
            </h2>
            <p className={`mt-4 max-w-4xl text-sm leading-7 sm:text-base ${mutedTextClass}`}>
              SKTECH is an integrated e-governance platform designed to help SK
              councils organize official records, improve transparency, and make
              federation coordination more accessible. It brings profiling,
              identity, events, attendance, announcements, and secure
              municipality communication into one consistent experience.
            </p>
          </article>

          <article className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                    isDarkTheme ? "text-cyan-300" : "text-blue-700"
                  }`}
                >
                  Core Features
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  One portal for the work SK teams repeat every week.
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {coreFeatures.map(({ title, description, Icon }) => (
                <div
                  key={title}
                  className={`rounded-2xl border p-4 ${borderClass} ${
                    isDarkTheme ? "bg-white/5" : "bg-slate-50/80"
                  }`}
                >
                  <Icon
                    className={isDarkTheme ? "h-5 w-5 text-cyan-300" : "h-5 w-5 text-blue-700"}
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 text-sm font-bold">{title}</h3>
                  <p className={`mt-2 text-xs leading-5 ${subtleTextClass}`}>
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                isDarkTheme ? "text-cyan-300" : "text-blue-700"
              }`}
            >
              How It Works
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-7">
              {howItWorks.map((step, index) => (
                <div
                  key={step}
                  className={`rounded-2xl border p-4 ${borderClass} ${
                    isDarkTheme ? "bg-slate-950/35" : "bg-white/70"
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                      isDarkTheme ? "bg-cyan-300 text-slate-950" : "bg-blue-600 text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-bold leading-5">{step}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <article className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                  isDarkTheme ? "text-cyan-300" : "text-blue-700"
                }`}
              >
                Intended Users
              </p>
              <div className="mt-5 grid gap-3">
                {intendedUsers.map((user) => (
                  <div
                    key={user}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${borderClass} ${
                      isDarkTheme ? "bg-white/5" : "bg-slate-50/80"
                    }`}
                  >
                    {user}
                  </div>
                ))}
              </div>
            </article>

            <article className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                  isDarkTheme ? "text-cyan-300" : "text-blue-700"
                }`}
              >
                Project Objectives
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {objectives.map((objective) => (
                  <p
                    key={objective}
                    className={`rounded-2xl border p-4 text-sm leading-6 ${borderClass} ${
                      isDarkTheme ? "bg-white/5" : "bg-slate-50/80"
                    }`}
                  >
                    {objective}
                  </p>
                ))}
              </div>
            </article>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                  isDarkTheme ? "text-cyan-300" : "text-blue-700"
                }`}
              >
                Technology / Innovation
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {technologies.map((item) => (
                  <span
                    key={item}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${chipClass}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <article className={`rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${
                  isDarkTheme ? "text-cyan-300" : "text-blue-700"
                }`}
              >
                Security & Privacy
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {securityHighlights.map((item) => (
                  <div
                    key={item}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${borderClass} ${
                      isDarkTheme ? "bg-white/5" : "bg-slate-50/80"
                    }`}
                  >
                    <ShieldCheck
                      className={isDarkTheme ? "h-4 w-4 text-cyan-300" : "h-4 w-4 text-blue-700"}
                      aria-hidden="true"
                    />
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer className="relative z-20 px-4 pb-8 sm:px-8 lg:px-16">
        <div className={`mx-auto w-full max-w-6xl rounded-[28px] p-6 sm:p-8 ${panelClass}`}>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-xl font-black tracking-tight">SKTECH</h2>
              <p className={`mt-3 max-w-3xl text-sm leading-6 ${mutedTextClass}`}>
                SK Provincial Federation Integrated E-Governance System for
                coordinated profiling, identity, announcements, events,
                attendance, and secure municipal communication.
              </p>
              <p className={`mt-4 text-xs leading-5 ${subtleTextClass}`}>
                SKTECH is currently a capstone project and prototype
                e-governance platform. It is not an official government system
                unless formally adopted and authorized by the appropriate
                government agency or local government unit.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${borderClass} ${isDarkTheme ? "bg-white/5" : "bg-slate-50/80"}`}>
              <p className="text-sm font-bold">Project Links</p>
              <div className={`mt-3 grid gap-2 text-sm ${mutedTextClass}`}>
                <Link href="/official/auth" className="font-semibold hover:underline">
                  Official Login
                </Link>
                <span>Privacy and Terms placeholder</span>
                <span>About SKTECH</span>
              </div>
              <p className={`mt-5 text-xs ${subtleTextClass}`}>
                Copyright 2026 SKTECH. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
