"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Fingerprint,
  IdCard,
  LockKeyhole,
  Menu,
  MessageSquare,
  QrCode,
  ScanFace,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  ["About", "#about"],
  ["Platform", "#platform"],
  ["Features", "#features"],
  ["Security", "#security"],
] as const;

const tickerItems = [
  ["Official Profiling", UsersRound],
  ["Digital ID", Fingerprint],
  ["QR Attendance", QrCode],
  ["Face Liveness", ScanFace],
  ["Announcements", MessageSquare],
  ["Events", CalendarDays],
  ["Analytics", BarChart3],
  ["Secure Chat", ShieldCheck],
] as const;

const workflowCards = [
  ["01", "Register Officials", "Capture verified profile records for Sangguniang Kabataan officials.", UsersRound],
  ["02", "Issue Digital IDs", "Produce QR-verifiable credentials from the same official profile.", IdCard],
  ["03", "Track Attendance", "Support event attendance with QR and facial verification tools.", QrCode],
] as const;

const featureGroups = [
  [
    "Identity & Records",
    "Maintain official profile data, admission state, and credential-ready records.",
    ["SK Official profiles", "Digital ID production", "Municipality and barangay records", "Profile photo synchronization"],
    Fingerprint,
  ],
  [
    "Field Operations",
    "Coordinate announcements, events, attendance, and staff validation work.",
    ["Event management", "QR attendance", "Face verification", "Automatic announcement archive"],
    CalendarDays,
  ],
  [
    "Governance Oversight",
    "Give authorized users live visibility into records, activity, and local coordination.",
    ["Admin analytics", "Municipality-scoped staff tools", "Secure chat", "Role-based dashboards"],
    BarChart3,
  ],
] as const;

const audienceCards = [
  ["SK Officials", "Access your digital ID, announcements, attendance history, chat, and official services.", UsersRound],
  ["Municipal Staff", "Review admissions, manage local events, monitor attendance, and support assigned councils.", CalendarDays],
  ["Provincial Admin", "Oversee province-wide records, staff access, ID production, analytics, and system governance.", ShieldCheck],
] as const;

const securityItems = ["Role-Based Access", "Private Photo Storage", "Municipality Isolation", "Protected Credentials"];

export default function HomePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginActions, setShowLoginActions] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const ctaRef = useRef<HTMLElement | null>(null);
  const getStartedAudioRef = useRef<HTMLAudioElement | null>(null);
  const loginSelectAudioRef = useRef<HTMLAudioElement | null>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const { scrollYProgress: showcaseProgress } = useScroll({
    target: showcaseRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"],
  });

  const heroVisualY = useTransform(heroProgress, [0, 1], [0, 90]);
  const showcaseFloatY = useTransform(showcaseProgress, [0, 1], [90, -90]);
  const ctaFloatY = useTransform(ctaProgress, [0, 1], [70, -70]);

  const reveal = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.18 },
        transition: { duration: 0.65 },
      };

  const onGetStarted = () => {
    setShowLoginActions(true);
    document.getElementById("access")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
    });

    const audio = getStartedAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Browser autoplay rules may block sound before direct user interaction.
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
    <div className="min-h-screen overflow-x-hidden bg-[#f6f8ff] text-[#06132d]">
      <audio ref={getStartedAudioRef} preload="auto" src="/sounds/e-1.mp3" />
      <audio ref={loginSelectAudioRef} preload="auto" src="/sounds/e-2.mp3" />

      <header className="sticky top-0 z-50 backdrop-blur-sm">
        <div className="bg-[#06132d] px-5 py-3 text-sm text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 text-center md:justify-between">
            <p className="hidden text-white/60 md:block">
              Integrated E-Governance and Emerging Technology Platform
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-1 font-semibold"
            >
              Start with SK Official access <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-black/5 bg-white/80 px-5 py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="relative inline-flex h-11 w-11 items-center justify-center">
                <span className="absolute inset-0 rounded-xl bg-[linear-gradient(to_right,#b3262d,#1f64d6,#2fd8fe)] opacity-35 blur" />
                <Image
                  src="/assets/logos/sktech-logo-enhance.png"
                  alt="SKTECH"
                  width={44}
                  height={44}
                  className="relative h-11 w-11 object-contain"
                  priority
                />
              </span>
              <span className="text-sm font-black uppercase text-[#06132d]">
                SKTECH
              </span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-medium text-black/60 md:flex">
              {navItems.map(([label, href]) => (
                <a key={href} href={href} className="transition hover:text-[#123ec2]">
                  {label}
                </a>
              ))}
              <ThemeToggle />
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center justify-center rounded-lg bg-[#06132d] px-4 py-2 font-semibold text-white shadow-[0_8px_20px_-12px_rgba(6,19,45,0.95)] transition hover:bg-[#102b56]"
              >
                Get Started
              </button>
            </nav>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Toggle navigation"
                onClick={() => setMenuOpen((open) => !open)}
                className="rounded-lg border border-black/10 p-2 text-[#06132d]"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {menuOpen ? (
            <nav className="mx-auto mt-5 grid max-w-7xl gap-2 rounded-xl border border-black/5 bg-white p-3 text-sm font-semibold text-[#06132d] shadow-lg md:hidden">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 hover:bg-slate-50"
                >
                  {label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onGetStarted();
                }}
                className="rounded-lg bg-[#06132d] px-4 py-3 text-white"
              >
                Get Started
              </button>
            </nav>
          ) : null}
        </div>
      </header>

      <main>
        <section
          ref={heroRef}
          id="about"
          className="relative isolate overflow-hidden px-5 pb-20 pt-10 sm:px-8 lg:px-10"
        >
          <div
            className="absolute inset-0 -z-20 bg-[#eaf0ff]"
            style={{
              background:
                "radial-gradient(ellipse 170% 110% at bottom left, #183ec2 0%, #eaf0ff 58%, #ffffff 100%)",
            }}
          />
          <Image
            src="/assets/logos/sktech-logo-enhance.png"
            alt=""
            width={720}
            height={720}
            className="pointer-events-none absolute -right-32 top-20 -z-10 hidden h-[620px] w-[620px] object-contain opacity-[0.08] lg:block"
            priority
          />

          <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
            <div className="pt-8 md:pt-12">
              <motion.div
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 14 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.55 },
                    })}
                className="inline-flex items-center gap-2 rounded-lg border border-[#06132d]/10 bg-white/55 px-3 py-1 text-sm font-semibold text-[#06132d]"
              >
                <Sparkles className="h-4 w-4 text-[#b3262d]" />
                Province-ready SK governance platform
              </motion.div>

              <motion.h1
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 24 },
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: 0.08, duration: 0.7 },
                    })}
                className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] text-[#06132d] sm:text-6xl lg:text-7xl"
              >
                Digital governance for{" "}
                <span className="bg-gradient-to-b from-[#123ec2] to-[#001e80] bg-clip-text text-transparent">
                  Sangguniang Kabataan
                </span>
              </motion.h1>

              <motion.p
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 18 },
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: 0.16, duration: 0.7 },
                    })}
                className="mt-6 max-w-2xl text-lg leading-8 text-[#010d3e]"
              >
                SKTECH connects official profiling, digital identification, attendance,
                announcements, analytics, and secure communication in one public-facing
                governance system.
              </motion.p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center rounded-lg bg-[#06132d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#102b56]"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-[#06132d] transition hover:bg-white/40"
                >
                  About SKTECH <ChevronDown className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <motion.div
              style={reducedMotion ? undefined : { y: heroVisualY }}
              className="relative min-h-[440px] md:min-h-[610px]"
            >
              <div className="absolute left-1/2 top-8 h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-[#06132d] shadow-[0_30px_80px_-38px_rgba(6,19,45,0.85)] sm:h-[420px] sm:w-[420px] md:top-16 md:h-[510px] md:w-[510px]" />
              <div className="absolute left-1/2 top-14 h-[280px] w-[280px] -translate-x-1/2 rounded-full border border-white/30 bg-[linear-gradient(135deg,#ffffff,#dce7ff_46%,#2fd8fe)] shadow-[inset_0_0_60px_rgba(18,62,194,0.24)] sm:h-[360px] sm:w-[360px] md:top-24 md:h-[440px] md:w-[440px]" />
              <Image
                src="/assets/logos/sktech-logo-enhance.png"
                alt="SKTECH platform logo"
                width={420}
                height={420}
                className="absolute left-1/2 top-28 h-[210px] w-[210px] -translate-x-1/2 object-contain drop-shadow-2xl sm:h-[290px] sm:w-[290px] md:top-44 md:h-[330px] md:w-[330px]"
                priority
              />
              <motion.div
                animate={reducedMotion ? undefined : { y: [-12, 12] }}
                transition={{ repeat: Infinity, repeatType: "mirror", duration: 3.5, ease: "easeInOut" }}
                className="absolute left-0 top-20 rounded-2xl border border-white/30 bg-white/80 p-4 shadow-[0_20px_45px_-28px_rgba(6,19,45,0.75)] backdrop-blur"
              >
                <p className="text-xs font-bold uppercase text-[#123ec2]">Verified Officials</p>
                <p className="mt-2 text-3xl font-black text-[#06132d]">Live</p>
              </motion.div>
              <motion.div
                animate={reducedMotion ? undefined : { y: [14, -14] }}
                transition={{ repeat: Infinity, repeatType: "mirror", duration: 4.2, ease: "easeInOut" }}
                className="absolute bottom-20 right-0 rounded-2xl border border-white/30 bg-white/85 p-4 shadow-[0_20px_45px_-28px_rgba(6,19,45,0.75)] backdrop-blur"
              >
                <p className="text-xs font-bold uppercase text-[#b3262d]">QR + Face</p>
                <p className="mt-2 text-sm font-bold text-[#06132d]">Attendance ready</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="bg-white px-5 py-8 sm:px-8 lg:px-10">
          <div
            className="mx-auto flex max-w-7xl overflow-hidden"
            style={{ maskImage: "linear-gradient(to right, transparent, black, transparent)" }}
          >
            <motion.div
              className="flex flex-none gap-12 pr-12"
              animate={reducedMotion ? undefined : { x: "-50%" }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear", repeatType: "loop" }}
            >
              {[...tickerItems, ...tickerItems].map(([label, Icon], index) => (
                <div
                  key={`${label}-${index}`}
                  className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-black/45"
                >
                  <Icon className="h-5 w-5 text-[#123ec2]" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          ref={showcaseRef}
          id="platform"
          className="overflow-hidden bg-gradient-to-b from-white to-[#d2dcff] px-5 py-24 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="mx-auto max-w-[620px] text-center">
              <div className="inline-flex rounded-lg border border-[#06132d]/10 bg-white px-3 py-1 text-sm font-semibold text-[#06132d]">
                SKTECH Platform
              </div>
              <h2 className="mt-5 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                A clearer way to run youth governance operations.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#010d3e]/75">
                A single record can move from registration to profiling, ID production,
                attendance, and analytics without fragmenting data.
              </p>
            </motion.div>

            <div className="relative mt-12">
              <motion.div
                style={reducedMotion ? undefined : { y: showcaseFloatY }}
                className="absolute -right-20 -top-20 hidden h-56 w-56 rounded-[3rem] bg-[#06132d] p-8 shadow-[0_28px_80px_-40px_rgba(6,19,45,0.9)] md:block"
              >
                <ShieldCheck className="h-full w-full text-cyan-200" />
              </motion.div>
              <motion.div
                style={reducedMotion ? undefined : { y: showcaseFloatY }}
                className="absolute -bottom-20 -left-16 hidden h-48 w-48 rounded-[3rem] bg-[#b3262d] p-8 shadow-[0_28px_80px_-40px_rgba(179,38,45,0.9)] md:block"
              >
                <QrCode className="h-full w-full text-white" />
              </motion.div>

              <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[#06132d] text-white shadow-[0_28px_80px_-38px_rgba(6,19,45,0.75)]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#b3262d]" />
                    <span className="h-3 w-3 rounded-full bg-amber-300" />
                    <span className="h-3 w-3 rounded-full bg-cyan-300" />
                  </div>
                  <p className="hidden text-xs font-bold uppercase text-white/35 sm:block">
                    SKTECH governance workspace
                  </p>
                  <span className="h-2 w-16 rounded-full bg-white/10" />
                </div>

                <div className="grid gap-0 lg:grid-cols-[230px_1fr]">
                  <aside className="hidden border-r border-white/10 p-6 lg:block">
                    <div className="flex items-center gap-3 text-sm font-black">
                      <Image
                        src="/assets/logos/sktech-logo-enhance.png"
                        alt=""
                        width={34}
                        height={34}
                        className="h-8 w-8 object-contain"
                      />
                      SKTECH
                    </div>
                    <div className="mt-10 grid gap-2 text-sm text-white/45">
                      <span className="rounded-xl bg-cyan-300/10 px-3 py-3 text-cyan-200">Overview</span>
                      <span className="px-3 py-3">Officials</span>
                      <span className="px-3 py-3">Attendance</span>
                      <span className="px-3 py-3">Analytics</span>
                    </div>
                  </aside>

                  <div className="p-5 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-cyan-300">Provincial overview</p>
                        <h3 className="mt-2 text-2xl font-black">Connected council operations</h3>
                      </div>
                      <span className="w-fit rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
                        Role-aware
                      </span>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      {[
                        ["Official records", "Unified"],
                        ["Digital IDs", "QR-ready"],
                        ["Analytics", "Live"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                          <p className="text-sm text-white/45">{label}</p>
                          <p className="mt-4 text-3xl font-black">{value}</p>
                          <div className="mt-4 h-2 rounded-full bg-white/10">
                            <div className="h-full w-4/5 rounded-full bg-cyan-300" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr_1fr]">
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/15 to-white/[0.03] p-5">
                        <p className="text-sm font-bold text-white">Governance activity</p>
                        <div className="mt-5 flex h-24 items-end gap-3">
                          {[38, 62, 44, 86, 70, 96, 78].map((height, index) => (
                            <span
                              key={index}
                              className="w-full rounded-t-lg bg-cyan-300/70"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                        <p className="text-sm text-white/45">Next workflow</p>
                        <p className="mt-3 text-lg font-black">Profile to ID</p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-cyan-200">
                          <QrCode className="h-4 w-4" /> Credential verification enabled
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-24 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase text-[#123ec2]">How It Works</p>
                <h2 className="mt-4 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                  One platform. Connected governance.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-black/55">
                SKTECH keeps the public landing experience simple while routing each user
                into the right secure workspace.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {workflowCards.map(([number, title, description, Icon]) => (
                <motion.article
                  key={title}
                  {...reveal}
                  className="rounded-3xl border border-[#f1f1f1] bg-white p-8 shadow-[0_7px_24px_rgba(6,19,45,0.08)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-black text-black/25">{number}</span>
                    <Icon className="h-6 w-6 text-[#123ec2]" />
                  </div>
                  <h3 className="mt-16 text-2xl font-black text-[#06132d]">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-black/55">{description}</p>
                  <div className="mt-7 h-px w-12 bg-[#123ec2]" />
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white px-5 pb-24 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="mx-auto max-w-[620px] text-center">
              <div className="inline-flex rounded-lg border border-[#06132d]/10 px-3 py-1 text-sm font-semibold">
                Core Governance Features
              </div>
              <h2 className="mt-5 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                Built around the work that matters.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#010d3e]/75">
                The public experience stays focused on SKTECH identity and routes officials
                to the existing secure login flow.
              </p>
            </motion.div>

            <div className="mt-12 flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-center">
              {featureGroups.map(([title, description, items, Icon], index) => (
                <motion.article
                  key={title}
                  {...reveal}
                  className={`w-full max-w-sm rounded-3xl border p-8 shadow-[0_7px_24px_rgba(6,19,45,0.08)] ${
                    index === 1
                      ? "border-[#06132d] bg-[#06132d] text-white"
                      : "border-[#f1f1f1] bg-white text-[#06132d]"
                  }`}
                >
                  <div className="flex justify-between">
                    <h3 className={`text-lg font-bold ${index === 1 ? "text-white/70" : "text-black/50"}`}>
                      {title}
                    </h3>
                    <Icon className={`h-6 w-6 ${index === 1 ? "text-cyan-200" : "text-[#123ec2]"}`} />
                  </div>
                  <p className="mt-8 text-3xl font-black leading-tight">{description}</p>
                  <ul className="mt-8 grid gap-4">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm">
                        <Check className="h-5 w-5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#06132d] px-5 py-24 text-white sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-black uppercase text-cyan-300">Intended Users</p>
                <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                  Governance, at every level.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/55">
                Different roles keep their existing secure dashboards, while the landing page
                remains a clear front door for the platform.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {audienceCards.map(([title, description, Icon]) => (
                <motion.article key={title} {...reveal} className="rounded-3xl border border-white/10 bg-white/[0.06] p-8">
                  <Icon className="h-7 w-7 text-cyan-200" />
                  <h3 className="mt-16 text-2xl font-black">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-white/55">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="bg-[#f6f8ff] px-5 py-24 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div {...reveal}>
              <p className="text-xs font-black uppercase text-[#123ec2]">Security & Access</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                Designed for protected public service workflows.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-black/55">
                SKTECH keeps sensitive actions behind role-aware routes while preserving
                simple public credential verification.
              </p>
              <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {securityItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-[#f1f1f1] bg-white px-4 py-4 text-sm font-bold text-[#06132d] shadow-sm"
                  >
                    <LockKeyhole className="h-5 w-5 text-[#123ec2]" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              {...reveal}
              className="rounded-3xl border border-[#f1f1f1] bg-white p-8 shadow-[0_24px_70px_-42px_rgba(6,19,45,0.8)]"
            >
              <div className="flex items-center justify-between border-b border-black/5 pb-6">
                <div>
                  <p className="text-xs font-black uppercase text-black/35">Technology foundation</p>
                  <p className="mt-2 text-xl font-black text-[#06132d]">Built to evolve with councils</p>
                </div>
                <ShieldCheck className="h-7 w-7 text-[#123ec2]" />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {["Next.js", "PostgreSQL", "Supabase", "AWS Rekognition", "PWA", "QR Technology"].map(
                  (technology) => (
                    <span
                      key={technology}
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-black/55"
                    >
                      {technology}
                    </span>
                  ),
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <section
          ref={ctaRef}
          id="access"
          className="relative overflow-hidden bg-gradient-to-b from-white to-[#d2dcff] px-5 py-24 sm:px-8 lg:px-10"
        >
          <motion.div
            style={reducedMotion ? undefined : { y: ctaFloatY }}
            className="absolute -left-24 top-10 hidden h-64 w-64 rounded-[4rem] bg-[#b3262d] p-10 opacity-90 shadow-[0_24px_70px_-36px_rgba(179,38,45,0.9)] lg:block"
          >
            <Sparkles className="h-full w-full text-white" />
          </motion.div>
          <motion.div
            style={reducedMotion ? undefined : { y: ctaFloatY }}
            className="absolute -right-20 bottom-12 hidden h-64 w-64 rounded-[4rem] bg-[#06132d] p-10 shadow-[0_24px_70px_-36px_rgba(6,19,45,0.9)] lg:block"
          >
            <Fingerprint className="h-full w-full text-cyan-200" />
          </motion.div>

          <div className="mx-auto max-w-[620px] text-center">
            <motion.div {...reveal} className="inline-flex rounded-lg border border-[#06132d]/10 bg-white px-3 py-1 text-sm font-semibold">
              Start with the right access
            </motion.div>
            <motion.h2 {...reveal} className="mt-5 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
              Modernizing youth governance, one council at a time.
            </motion.h2>
            <motion.p {...reveal} className="mt-5 text-lg leading-8 text-[#010d3e]/75">
              Officials can continue through the existing official portal. Staff and admin
              entry points remain hidden from the public landing page.
            </motion.p>

            <motion.div {...reveal} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center justify-center rounded-lg bg-[#06132d] px-5 py-3 text-sm font-bold text-white"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-[#06132d]"
              >
                Learn More
              </Link>
            </motion.div>

            {showLoginActions ? (
              <motion.div
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 12 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.35 },
                    })}
                className="mt-6"
              >
                <Link
                  href="/official/auth"
                  onClick={(event) => onLoginSelect(event, "/official/auth")}
                  className="inline-flex rounded-xl bg-[#b3262d] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_35px_-24px_rgba(179,38,45,0.9)]"
                >
                  SK Official Login
                </Link>
              </motion.div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="bg-[#06132d] px-5 py-12 text-center text-sm text-[#bcbcbc] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative inline-flex before:absolute before:inset-x-0 before:bottom-0 before:top-2 before:bg-[linear-gradient(to_right,#b3262d,#1f64d6,#2fd8fe)] before:blur">
            <Image
              src="/assets/logos/sktech-logo-enhance.png"
              alt="SKTECH"
              width={44}
              height={44}
              className="relative h-11 w-11 object-contain"
            />
          </div>

          <nav className="mt-7 flex flex-col gap-4 md:flex-row md:justify-center md:gap-7">
            <a href="#about">About</a>
            <a href="#platform">Platform</a>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <Link href="/about">About SKTECH</Link>
          </nav>

          <p className="mx-auto mt-7 max-w-xl text-xs leading-6 text-white/35">
            SKTECH is a capstone and prototype e-governance platform. It is not an
            official government system unless formally adopted and authorized by the
            appropriate government authority.
          </p>
          <p className="mt-7 text-xs text-white/30">
            SKTECH Provincial Federation Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
