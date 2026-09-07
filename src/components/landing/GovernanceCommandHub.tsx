"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  IdCard,
  LandPlot,
  Newspaper,
  QrCode,
  ScanFace,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const modules = [
  {
    id: "identity",
    label: "Digital ID",
    eyebrow: "Verified identity",
    description: "Verified SK official identity with QR-ready digital ID.",
    icon: IdCard,
    accent: "blue",
    detail: "Approved official profiles become clear, portable credentials for everyday federation services.",
    signals: ["QR-ready credentials", "Approved records", "Public verification"],
  },
  {
    id: "attendance",
    label: "Attendance",
    eyebrow: "Field operations",
    description: "Track event attendance through QR and face verification.",
    icon: CalendarCheck2,
    accent: "gold",
    detail: "Connect event sessions to the right official record while keeping attendance history organized.",
    signals: ["Event sessions", "QR scanning", "Attendance history"],
  },
  {
    id: "news",
    label: "Public News",
    eyebrow: "Public information",
    description: "Admin-published updates appear on the public SKTECH homepage.",
    icon: Newspaper,
    accent: "red",
    detail: "Keep public notices visible and easy to find without opening a secure workspace.",
    signals: ["Published notices", "Public homepage", "Clear updates"],
  },
  {
    id: "feed",
    label: "Internal Feed",
    eyebrow: "Council communication",
    description: "Staff and Admin can share pubmats, announcements, comments, and reactions.",
    icon: FileCheck2,
    accent: "cyan",
    detail: "A focused space for municipality-scoped updates and province-wide administration posts.",
    signals: ["Protected pubmats", "Role-aware access", "Shared context"],
  },
  {
    id: "analytics",
    label: "Analytics",
    eyebrow: "Governance oversight",
    description: "Province and municipality dashboards summarize participation and activity.",
    icon: BarChart3,
    accent: "blue",
    detail: "Turn connected records into a clearer view of council activity and federation progress.",
    signals: ["Participation views", "Activity summaries", "Admin oversight"],
  },
  {
    id: "review",
    label: "Staff Review",
    eyebrow: "Municipal operations",
    description: "Staff validate official admissions and profile updates.",
    icon: UsersRound,
    accent: "gold",
    detail: "Give municipal staff the tools to review records and support their assigned councils.",
    signals: ["Admission review", "Profile support", "Municipality scope"],
  },
  {
    id: "verification",
    label: "QR / Face",
    eyebrow: "Secure verification",
    description: "Secure verification tools reduce manual checking.",
    icon: ScanFace,
    accent: "cyan",
    detail: "Use QR and face verification where enabled to support confident, accountable workflows.",
    signals: ["QR technology", "Face liveness", "Identity checks"],
  },
  {
    id: "records",
    label: "Municipality Records",
    eyebrow: "Organized records",
    description: "Organized SK records by municipality and barangay.",
    icon: LandPlot,
    accent: "red",
    detail: "Keep federation records connected to the local context where councils actually work.",
    signals: ["Municipality data", "Barangay context", "Connected profiles"],
  },
] as const;

type ModuleId = (typeof modules)[number]["id"];

const accentStyles = {
  blue: {
    icon: "bg-blue-400/15 text-blue-200",
    selected: "border-blue-300/60 bg-blue-400/15 shadow-[0_18px_42px_-24px_rgba(96,165,250,0.85)]",
    dot: "bg-blue-300",
  },
  gold: {
    icon: "bg-amber-300/15 text-amber-200",
    selected: "border-amber-200/60 bg-amber-300/15 shadow-[0_18px_42px_-24px_rgba(251,191,36,0.7)]",
    dot: "bg-amber-200",
  },
  red: {
    icon: "bg-rose-400/15 text-rose-200",
    selected: "border-rose-300/60 bg-rose-400/15 shadow-[0_18px_42px_-24px_rgba(251,113,133,0.65)]",
    dot: "bg-rose-300",
  },
  cyan: {
    icon: "bg-cyan-300/15 text-cyan-200",
    selected: "border-cyan-200/60 bg-cyan-300/15 shadow-[0_18px_42px_-24px_rgba(103,232,249,0.65)]",
    dot: "bg-cyan-200",
  },
} as const;

export default function GovernanceCommandHub() {
  const reducedMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<ModuleId>("identity");
  const selected = modules.find((module) => module.id === selectedId) ?? modules[0];
  const SelectedIcon = selected.icon;
  const selectedStyle = accentStyles[selected.accent];

  return (
    <section id="command-hub" className="relative isolate overflow-hidden bg-[#071126] px-4 py-20 text-white sm:px-8 sm:py-24 lg:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_40%,rgba(20,82,217,0.22),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(243,199,43,0.1),transparent_24%),linear-gradient(135deg,#071126_0%,#0a1b3b_52%,#06102a_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(147,197,253,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,0.06)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-200" /> Platform preview
          </div>
          <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Your SK Federation Command Hub</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Explore how SKTECH connects officials, staff, public updates, digital IDs, attendance, and analytics in one secure platform.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.02fr_1.08fr_0.9fr] lg:items-stretch lg:gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const active = module.id === selectedId;
              const styles = accentStyles[module.accent];
              return (
                <button
                  key={module.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedId(module.id)}
                  className={`group min-h-[128px] rounded-2xl border p-4 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${active ? styles.selected : "border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.08]"}`}
                >
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${styles.icon}`}><Icon className="h-4 w-4" /></span>
                  <span className="mt-4 block text-sm font-black text-white">{module.label}</span>
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{module.eyebrow}</span>
                </button>
              );
            })}
          </div>

          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[2rem] border border-blue-300/20 bg-[#091a37]/90 p-6 shadow-[0_28px_80px_-38px_rgba(37,99,235,0.8)] sm:p-8">
            <div className="pointer-events-none absolute inset-8 rounded-full border border-blue-300/10" />
            <div className="pointer-events-none absolute inset-16 rounded-full border border-dashed border-amber-200/15" />
            <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative z-10 flex w-full max-w-[300px] flex-col items-center text-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-white/20 bg-[#06132d] shadow-[0_0_0_12px_rgba(96,165,250,0.05),0_25px_60px_-26px_rgba(96,165,250,0.95)]">
                <div className="absolute inset-3 rounded-full border border-blue-300/25" />
                <div className="absolute -right-1 top-5 h-3 w-3 rounded-full bg-amber-200 shadow-[0_0_20px_rgba(253,230,138,0.95)]" />
                <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4"><ShieldCheck className="h-10 w-10 text-blue-200" /></div>
              </div>
              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-amber-200">SKTECH · Oriental Mindoro</p>
              <h3 className="mt-3 text-2xl font-black">Connected governance</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">Select a module to explore the platform layer behind the federation workflow.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">Role-aware</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2">Secure by design</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Selected module</p>
                <AnimatePresence mode="wait">
                  <motion.p key={selected.id} initial={reducedMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-xl font-black text-white">{selected.label}</motion.p>
                </AnimatePresence>
              </div>
              <div className={`rounded-xl p-3 ${selectedStyle.icon}`}><SelectedIcon className="h-5 w-5" /></div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={selected.id} initial={reducedMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : 0.22 }} className="flex flex-1 flex-col">
                <p className="mt-6 text-lg font-bold leading-7 text-slate-100">{selected.description}</p>
                <p className="mt-4 text-sm leading-6 text-slate-400">{selected.detail}</p>
                <div className="mt-6 grid gap-2">
                  {selected.signals.map((signal) => <div key={signal} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{signal}</div>)}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link href="/official/auth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-xs font-black text-white transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">Official Portal <ArrowUpRight className="h-4 w-4" /></Link>
              <Link href="#news" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs font-black text-slate-200 transition hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">View Public Updates <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2"><Fingerprint className="h-4 w-4 text-blue-300" /> Identity-aware workflows</span>
          <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-200" /> Municipality context</span>
          <span className="inline-flex items-center gap-2"><QrCode className="h-4 w-4 text-rose-200" /> QR-ready services</span>
        </div>
      </div>
    </section>
  );
}
