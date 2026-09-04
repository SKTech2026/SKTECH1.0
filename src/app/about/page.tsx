import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  IdCard,
  MessageSquareLock,
  QrCode,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react";

const coreFeatures = [
  {
    title: "SK Official Profiling",
    description:
      "Organizes verified official records for faster review, updates, and accountability.",
    Icon: UsersRound,
  },
  {
    title: "Digital ID",
    description:
      "Gives approved officials a consistent credential view connected to their SKTECH record.",
    Icon: IdCard,
  },
  {
    title: "QR / Face Attendance",
    description:
      "Supports event attendance workflows through QR scanning and face verification where enabled.",
    Icon: QrCode,
  },
  {
    title: "Announcements",
    description:
      "Centralizes important federation and municipal updates for officials and staff.",
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
      "Keeps communication focused within the appropriate municipality and authorized users.",
    Icon: MessageSquareLock,
  },
  {
    title: "Mobile / PWA Access",
    description:
      "Provides a phone-ready experience for field work, scanning, updates, and coordination.",
    Icon: Smartphone,
  },
  {
    title: "Analytics",
    description:
      "Turns activity, attendance, and participation records into clearer summaries.",
    Icon: BarChart3,
  },
];

const workflow = [
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
  "Reduce manual processes.",
  "Centralize SK records.",
  "Improve transparency.",
  "Improve communication.",
  "Improve coordination.",
  "Improve accessibility.",
  "Support digital transformation of youth governance.",
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
  "Municipality-based restrictions",
  "Secure authentication",
  "Encrypted facial embeddings",
  "Private document storage",
  "Server-side authorization",
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:px-8 lg:px-16">
      <Image
        src="/illustrations/dark.svg"
        alt="SKTech about background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-70 saturate-[1.12] contrast-[1.08]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_14%,rgba(56,189,248,0.20),transparent_38%),radial-gradient(circle_at_85%_18%,rgba(59,130,246,0.16),transparent_42%),linear-gradient(135deg,rgba(2,6,23,0.36),rgba(2,6,23,0.78))]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-6">
        <header className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-cyan-300/30 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
          >
            Back to Home
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
            About SKTECH
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Integrated E-Governance and Emerging Technology Platform
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
            SKTECH is designed to support Sangguniang Kabataan councils with a
            centralized digital workspace for official records, credentials,
            announcements, events, attendance, and secure municipality
            coordination.
          </p>
        </header>

        <section className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
            Core Features
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {coreFeatures.map(({ title, description, Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <Icon className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-bold">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
            How It Works
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-7">
            {workflow.map((step, index) => (
              <article
                key={step}
                className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                  {index + 1}
                </span>
                <h2 className="mt-3 text-sm font-bold leading-5">{step}</h2>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
              Intended Users
            </p>
            <div className="mt-5 grid gap-3">
              {intendedUsers.map((user) => (
                <p
                  key={user}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold"
                >
                  {user}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
              Project Objectives
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {objectives.map((objective) => (
                <p
                  key={objective}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300"
                >
                  {objective}
                </p>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
              Technology / Innovation
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {technologies.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
              Security & Privacy
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {securityHighlights.map((item) => (
                <p
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold"
                >
                  <ShieldCheck
                    className="h-4 w-4 shrink-0 text-cyan-300"
                    aria-hidden="true"
                  />
                  {item}
                </p>
              ))}
            </div>
          </section>
        </div>

        <footer className="rounded-[28px] bg-slate-900/68 p-6 shadow-[0_22px_80px_-26px_rgba(56,189,248,0.55)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-300">
            Capstone Project Disclaimer
          </p>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            SKTECH is currently a capstone project and prototype e-governance
            platform. It is not an official government system unless formally
            adopted and authorized by the appropriate government agency or local
            government unit.
          </p>
          <div className="mt-6 border-t border-white/10 pt-5">
            <h2 className="text-xl font-black tracking-tight">SKTECH</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              SK Provincial Federation Integrated E-Governance System for
              coordinated profiling, identity, announcements, events,
              attendance, and secure municipal communication.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Copyright 2026 SKTECH. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
