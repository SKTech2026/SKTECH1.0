"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Compass,
  Fingerprint,
  IdCard,
  LockKeyhole,
  Menu,
  MessageCircle,
  MessageSquare,
  QrCode,
  ScanFace,
  Send,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

type ChatMessage = {
  role: "bot" | "user";
  text: string;
};

const logoPath = "/assets/logos/sktech-logo-enhance.png";

const navItems = [
  ["Overview", "#about"],
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

const suggestedQuestions = [
  "What is SKTECH?",
  "How do I register?",
  "How does Digital ID work?",
  "What is Face Liveness?",
  "What can Staff access?",
  "Is SKTECH official?",
] as const;

const fallbackAnswer =
  "I can help with questions about SKTECH features, access, registration, Digital ID, attendance, security, and system use.";

function answerQuestion(question: string) {
  const text = question.toLowerCase();

  if (text.includes("register") || text.includes("registration")) {
    return "SK Officials can register through the Official portal, verify their email with OTP, complete their profile, and wait for the required approval flow.";
  }

  if (text.includes("profiling") || text.includes("profile")) {
    return "SK Official Profiling keeps verified official records in one place so IDs, attendance, analytics, and role-based services use consistent information.";
  }

  if (text.includes("digital id") || text.includes(" id")) {
    return "Digital ID uses the approved official profile and QR verification so credentials can be checked through the existing SKTECH ID flow.";
  }

  if (text.includes("qr") || text.includes("attendance")) {
    return "QR Attendance helps staff validate event attendance with QR scanning and supported face verification where enabled.";
  }

  if (text.includes("liveness") || text.includes("face")) {
    return "Face Liveness guides officials through a selfie check before SKTECH updates the encrypted face template used by verification tools.";
  }

  if (text.includes("staff")) {
    return "Staff can access assigned-municipality workflows such as admissions, profiling support, events, attendance monitoring, announcements, and staff chat.";
  }

  if (text.includes("admin")) {
    return "Admin users manage province-wide oversight such as staff access, municipalities, ID production, analytics, events, and system governance.";
  }

  if (text.includes("municipality") || text.includes("scoping") || text.includes("scope")) {
    return "Municipality scoping limits staff views and actions to their assigned municipality while Admin users retain province-wide oversight.";
  }

  if (text.includes("government") || text.includes("official system")) {
    return "SKTECH is a capstone and prototype e-governance platform unless it is formally adopted and authorized by the appropriate government authority.";
  }

  if (text.includes("help") || text.includes("support")) {
    return "For support, use the proper SKTECH administrator or project contact for your municipality or federation access issue.";
  }

  if (text.includes("what is") || text.includes("sktech")) {
    return "SKTECH is an e-governance platform for SK operations, including official profiling, Digital ID, attendance, announcements, analytics, and secure communication.";
  }

  return fallbackAnswer;
}

export default function HomePage() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginActions, setShowLoginActions] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi, I am Ask SKTECH. Choose a question or ask about registration, Digital ID, attendance, access, or system use.",
    },
  ]);
  const getStartedAudioRef = useRef<HTMLAudioElement | null>(null);
  const loginSelectAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const sections = ["about", "platform", "features", "security"]
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));

    const onScroll = () => setShowFloatingMenu(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const reveal = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.08 },
        transition: { duration: 0.5 },
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

  const sendChatMessage = (value?: string) => {
    const question = (value ?? chatInput).trim();
    if (!question) return;

    setChatMessages((messages) => [
      ...messages,
      { role: "user", text: question },
      { role: "bot", text: answerQuestion(question) },
    ]);
    setChatInput("");
    setChatOpen(true);
  };

  return (
    <div className={`landing-page min-h-screen overflow-x-hidden bg-[#f6f9ff] text-[#06132d] ${effectiveTheme === "dark" ? "landing-page-dark" : ""}`}>
      <audio ref={getStartedAudioRef} preload="auto" src="/sounds/e-1.mp3" />
      <audio ref={loginSelectAudioRef} preload="auto" src="/sounds/e-2.mp3" />

      <header
        aria-hidden={showFloatingMenu}
        className={`sticky top-0 z-40 overflow-hidden border-b border-[#dbe7ff] bg-white/90 px-4 shadow-[0_10px_30px_-26px_rgba(6,19,45,0.75)] backdrop-blur transition-[max-height,opacity,transform,padding] duration-300 sm:px-8 lg:px-10 ${
          showFloatingMenu
            ? "pointer-events-none max-h-0 -translate-y-full border-transparent py-0 opacity-0"
            : "max-h-32 py-4 opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center">
              <span className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,#cf2638,#1c5bd8,#f3c72b)] opacity-35 blur" />
              <Image
                src={logoPath}
                alt="SKTECH"
                width={44}
                height={44}
                className="relative h-11 w-11 object-contain"
                priority
              />
            </span>
            <span className="truncate text-sm font-black uppercase text-[#06132d]">
              SKTECH
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#24385f]/70 md:flex">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-[#1452d9]">
                {label}
              </a>
            ))}
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg border border-[#dbe7ff] p-2 text-[#06132d]"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="mx-auto mt-4 grid max-w-7xl gap-2 rounded-xl border border-[#dbe7ff] bg-white p-3 text-sm font-semibold text-[#06132d] shadow-lg md:hidden">
            {navItems.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 hover:bg-[#eef4ff]"
              >
                {label}
              </a>
            ))}
          </nav>
        ) : null}
      </header>

      {showFloatingMenu ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed left-3 top-20 z-50 sm:left-5"
        >
          <button
            type="button"
            aria-label="Open section navigation"
            aria-expanded={floatingMenuOpen}
            onClick={() => setFloatingMenuOpen((open) => !open)}
            className={`rounded-2xl border p-3 shadow-[0_18px_40px_-24px_rgba(6,19,45,0.8)] backdrop-blur-md transition ${
              effectiveTheme === "dark"
                ? "border-cyan-300/25 bg-slate-900/90 text-cyan-200 hover:bg-slate-800"
                : "border-[#bfd1f8] bg-white/90 text-[#0a3aa2] hover:bg-white"
            }`}
          >
            <Compass className="h-5 w-5" />
          </button>
          {floatingMenuOpen ? (
            <motion.nav
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              aria-label="Landing page sections"
              className={`mt-2 w-40 rounded-2xl border p-2 shadow-[0_20px_50px_-26px_rgba(6,19,45,0.8)] backdrop-blur-md ${
                effectiveTheme === "dark"
                  ? "border-cyan-300/20 bg-slate-900/95"
                  : "border-[#dbe7ff] bg-white/95"
              }`}
            >
              {navItems.map(([label, href]) => {
                const sectionId = href.slice(1);
                const active = activeSection === sectionId;
                return (
                  <a
                    key={href}
                    href={href}
                    aria-current={active ? "location" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById(sectionId)?.scrollIntoView({
                        behavior: reducedMotion ? "auto" : "smooth",
                        block: "start",
                      });
                      setFloatingMenuOpen(false);
                    }}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? effectiveTheme === "dark"
                          ? "bg-cyan-300/15 text-cyan-200"
                          : "bg-[#eaf2ff] text-[#0a3aa2]"
                        : effectiveTheme === "dark"
                          ? "text-slate-300 hover:bg-white/10 hover:text-white"
                          : "text-[#24385f]/70 hover:bg-[#f6f9ff] hover:text-[#0a3aa2]"
                    }`}
                  >
                    <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#cf2638] align-middle" />
                    {label}
                  </a>
                );
              })}
            </motion.nav>
          ) : null}
        </motion.div>
      ) : null}

      <main>
        <section
          id="about"
          className="relative isolate overflow-hidden px-4 pb-16 pt-10 sm:px-8 sm:pb-20 lg:px-10"
        >
          <div className="landing-hero-backdrop absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_10%,#fff2b8_0,#fff8dd_18%,transparent_34%),radial-gradient(circle_at_75%_25%,#dce8ff_0,#eaf2ff_24%,transparent_44%),linear-gradient(145deg,#ffffff_0%,#eef5ff_44%,#dce8ff_100%)]" />
          <div className="absolute left-0 top-0 -z-10 h-1.5 w-full bg-[linear-gradient(90deg,#cf2638,#f3c72b,#1452d9)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[0.88fr_1.12fr]">
            <div className="pt-4 md:pt-10">
              <motion.h1
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 24 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.62, ease: "easeOut" },
                    })}
                className="max-w-3xl text-5xl font-black leading-[0.98] text-[#0a3aa2] sm:text-6xl lg:text-7xl"
              >
                Oriental Mindoro
                <span className="relative mt-2 block text-[#06132d]">
                  SK Federation
                  <span className="absolute -bottom-1 left-0 h-2 w-36 rounded-full bg-[#f3c72b] sm:h-3 sm:w-52" />
                </span>
                <span className="mt-2 block bg-[linear-gradient(90deg,#1452d9,#1452d9_46%,#cf2638_47%,#cf2638_58%,#f3c72b_59%,#f3c72b_70%,#1452d9_71%)] bg-clip-text text-transparent">
                  E-Governance
                </span>
              </motion.h1>

              <motion.div
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 18 },
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: 0.12, duration: 0.5 },
                    })}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center rounded-full bg-[#06132d] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_32px_-26px_rgba(6,19,45,0.95)] transition hover:bg-[#0a3aa2]"
                >
                  Official Access <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border border-[#bfd1f8] bg-white/70 px-6 py-3 text-sm font-bold text-[#0a3aa2] backdrop-blur transition hover:bg-white"
                >
                  Ask SKTECH <MessageCircle className="ml-2 h-4 w-4" />
                </button>
              </motion.div>
            </div>

            <motion.div
              {...(reducedMotion
                ? {}
                : {
                    initial: { opacity: 0, scale: 0.96, y: 24 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    transition: { delay: 0.08, duration: 0.7 },
                  })}
              className="relative mx-auto min-h-[360px] w-full max-w-[560px] sm:min-h-[500px] md:min-h-[610px]"
            >
              <div className="landing-hero-orbit absolute left-1/2 top-6 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#06132d] shadow-[0_35px_90px_-42px_rgba(6,19,45,0.9)] sm:h-[440px] sm:w-[440px] md:top-12 md:h-[530px] md:w-[530px]" />
              <div className="landing-hero-circle absolute left-1/2 top-12 h-[250px] w-[250px] -translate-x-1/2 rounded-full border border-white/50 bg-[linear-gradient(135deg,#ffffff_0%,#edf4ff_42%,#f6d654_70%,#1452d9_100%)] shadow-[inset_0_0_70px_rgba(20,82,217,0.22)] sm:h-[370px] sm:w-[370px] md:top-24 md:h-[450px] md:w-[450px]" />
              <Image
                src={logoPath}
                alt="SKTECH platform logo"
                width={520}
                height={520}
                className="absolute left-1/2 top-20 h-[220px] w-[220px] -translate-x-1/2 object-contain drop-shadow-2xl sm:top-28 sm:h-[360px] sm:w-[360px] md:top-40 md:h-[390px] md:w-[390px]"
                priority
              />
              <motion.div
                animate={reducedMotion ? undefined : { y: [-8, 10, -8] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                className="landing-status absolute right-2 top-8 rounded-full border border-[#f3c72b]/50 bg-white/90 px-3 py-2 text-xs font-black uppercase text-[#0a3aa2] shadow-[0_18px_36px_-26px_rgba(6,19,45,0.85)] backdrop-blur sm:right-0 sm:top-24 sm:px-4"
              >
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#cf2638]" />
                Chat Feature
              </motion.div>
              <motion.div
                animate={reducedMotion ? undefined : { y: [12, -10, 12] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="landing-status absolute bottom-10 left-2 max-w-[150px] rounded-2xl border border-white/40 bg-white/85 p-4 shadow-[0_18px_42px_-28px_rgba(6,19,45,0.8)] backdrop-blur sm:bottom-16 sm:left-0"
              >
                <p className="text-xs font-bold uppercase text-[#cf2638]">QR + Face</p>
                <p className="mt-2 text-sm font-black leading-tight text-[#06132d]">Attendance ready</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="landing-light-surface bg-white px-4 py-7 sm:px-8 lg:px-10">
          <div
            className="mx-auto flex max-w-7xl overflow-hidden"
            style={{ maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}
          >
            <motion.div
              className="flex flex-none gap-10 pr-10"
              animate={reducedMotion ? undefined : { x: "-50%" }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear", repeatType: "loop" }}
            >
              {[...tickerItems, ...tickerItems].map(([label, Icon], index) => (
                <div
                  key={`${label}-${index}`}
                    className="landing-secondary flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#24385f]/55"
                >
                  <Icon className="h-5 w-5 text-[#1452d9]" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          id="platform"
          className="overflow-hidden bg-gradient-to-b from-white via-[#f6f9ff] to-[#dce8ff] px-4 py-20 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="mx-auto max-w-[620px] text-center">
              <div className="landing-light-surface inline-flex rounded-lg border border-[#bfd1f8] bg-white px-3 py-1 text-sm font-semibold text-[#0a3aa2]">
                SKTECH Platform
              </div>
              <h2 className="mt-5 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                Good Governance Operation
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#24385f]/75">
                A single record can move from registration to profiling, ID production,
                attendance, and analytics without fragmenting data.
              </p>
            </motion.div>

            <div className="relative mt-12">
              <div className="absolute -right-16 -top-16 hidden h-48 w-48 rounded-[3rem] bg-[#0a3aa2] p-8 shadow-[0_28px_80px_-40px_rgba(10,58,162,0.9)] md:block">
                <ShieldCheck className="h-full w-full text-[#f3c72b]" />
              </div>
              <div className="absolute -bottom-14 -left-12 hidden h-44 w-44 rounded-[3rem] bg-[#cf2638] p-8 shadow-[0_28px_80px_-40px_rgba(207,38,56,0.9)] md:block">
                <QrCode className="h-full w-full text-white" />
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[#06132d] text-white shadow-[0_28px_80px_-38px_rgba(6,19,45,0.75)]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#cf2638]" />
                    <span className="h-3 w-3 rounded-full bg-[#f3c72b]" />
                    <span className="h-3 w-3 rounded-full bg-[#1452d9]" />
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
                        src={logoPath}
                        alt=""
                        width={34}
                        height={34}
                        className="h-8 w-8 object-contain"
                      />
                      SKTECH
                    </div>
                    <div className="mt-10 grid gap-2 text-sm text-white/45">
                      <span className="rounded-xl bg-[#1452d9]/20 px-3 py-3 text-[#dbe7ff]">Overview</span>
                      <span className="px-3 py-3">Officials</span>
                      <span className="px-3 py-3">Attendance</span>
                      <span className="px-3 py-3">Analytics</span>
                    </div>
                  </aside>

                  <div className="p-5 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-[#f3c72b]">Provincial overview</p>
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
                            <div className="h-full w-4/5 rounded-full bg-[#f3c72b]" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr_1fr]">
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1452d9]/25 to-white/[0.03] p-5">
                        <p className="text-sm font-bold text-white">Governance activity</p>
                        <div className="mt-5 flex h-24 items-end gap-3">
                          {[38, 62, 44, 86, 70, 96, 78].map((height, index) => (
                            <span
                              key={index}
                              className="w-full rounded-t-lg bg-[#f3c72b]/80"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                        <p className="text-sm text-white/45">Next workflow</p>
                        <p className="mt-3 text-lg font-black">Profile to ID</p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#dbe7ff]">
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

        <section className="bg-white px-4 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase text-[#1452d9]">How It Works</p>
                <h2 className="mt-4 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                  One platform. Connected governance.
                </h2>
              </div>
              <p className="max-w-xl text-lg leading-8 text-[#24385f]/65">
                SKTECH keeps the public landing experience simple while routing each user
                into the right secure workspace.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {workflowCards.map(([number, title, description, Icon]) => (
                <motion.article
                  key={title}
                  {...reveal}
                  className="rounded-3xl border border-[#e4ecff] bg-white p-7 shadow-[0_7px_24px_rgba(6,19,45,0.08)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-black text-[#cf2638]">{number}</span>
                    <Icon className="h-6 w-6 text-[#1452d9]" />
                  </div>
                  <h3 className="mt-14 text-2xl font-black text-[#06132d]">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-[#24385f]/65">{description}</p>
                  <div className="mt-7 h-px w-12 bg-[#f3c72b]" />
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white px-4 pb-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="mx-auto max-w-[620px] text-center">
              <div className="inline-flex rounded-lg border border-[#bfd1f8] px-3 py-1 text-sm font-semibold text-[#0a3aa2]">
                Core Governance Features
              </div>
              <h2 className="mt-5 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                Built around the work that matters.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#24385f]/75">
                The public experience stays focused on SKTECH identity and routes officials
                to the existing secure login flow.
              </p>
            </motion.div>

            <div className="mt-12 flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-center">
              {featureGroups.map(([title, description, items, Icon], index) => (
                <motion.article
                  key={title}
                  {...reveal}
                  className={`w-full max-w-sm rounded-3xl border p-7 shadow-[0_7px_24px_rgba(6,19,45,0.08)] ${
                    index === 1
                      ? "border-[#06132d] bg-[#06132d] text-white"
                      : "border-[#e4ecff] bg-white text-[#06132d]"
                  }`}
                >
                  <div className="flex justify-between gap-4">
                    <h3 className={`text-lg font-bold ${index === 1 ? "text-white/70" : "text-[#24385f]/65"}`}>
                      {title}
                    </h3>
                    <Icon className={`h-6 w-6 shrink-0 ${index === 1 ? "text-[#f3c72b]" : "text-[#1452d9]"}`} />
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

        <section className="bg-[#06132d] px-4 py-20 text-white sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-black uppercase text-[#f3c72b]">Intended Users</p>
                <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
                  Governance, at every level.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/60">
                Different roles keep their existing secure dashboards, while the landing page
                remains a clear front door for the platform.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {audienceCards.map(([title, description, Icon]) => (
                <motion.article key={title} {...reveal} className="rounded-3xl border border-white/10 bg-white/[0.06] p-7">
                  <Icon className="h-7 w-7 text-[#f3c72b]" />
                  <h3 className="mt-14 text-2xl font-black">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-white/60">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="bg-[#f6f9ff] px-4 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div {...reveal}>
              <p className="text-xs font-black uppercase text-[#1452d9]">Security & Access</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
                Designed for protected public service workflows.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#24385f]/65">
                SKTECH keeps sensitive actions behind role-aware routes while preserving
                simple public credential verification.
              </p>
              <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {securityItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-[#e4ecff] bg-white px-4 py-4 text-sm font-bold text-[#06132d] shadow-sm"
                  >
                    <LockKeyhole className="h-5 w-5 text-[#1452d9]" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              {...reveal}
              className="rounded-3xl border border-[#e4ecff] bg-white p-7 shadow-[0_24px_70px_-42px_rgba(6,19,45,0.8)]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-6">
                <div>
                  <p className="text-xs font-black uppercase text-[#24385f]/45">Technology foundation</p>
                  <p className="mt-2 text-xl font-black text-[#06132d]">Built to evolve with councils</p>
                </div>
                <ShieldCheck className="h-7 w-7 shrink-0 text-[#1452d9]" />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {["Next.js", "PostgreSQL", "Supabase", "AWS Rekognition", "PWA", "QR Technology"].map(
                  (technology) => (
                    <span
                      key={technology}
                      className="rounded-full border border-[#dbe7ff] bg-[#f6f9ff] px-4 py-2 text-sm font-semibold text-[#24385f]/70"
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
          id="access"
          className="relative overflow-hidden bg-gradient-to-b from-white to-[#dce8ff] px-4 py-20 sm:px-8 lg:px-10"
        >
          <div className="absolute -left-24 top-10 hidden h-64 w-64 rounded-[4rem] bg-[#cf2638] p-10 opacity-90 shadow-[0_24px_70px_-36px_rgba(207,38,56,0.9)] lg:block">
            <Fingerprint className="h-full w-full text-white" />
          </div>
          <div className="absolute -right-20 bottom-12 hidden h-64 w-64 rounded-[4rem] bg-[#0a3aa2] p-10 shadow-[0_24px_70px_-36px_rgba(10,58,162,0.9)] lg:block">
            <MessageSquare className="h-full w-full text-[#f3c72b]" />
          </div>

          <div className="mx-auto max-w-[620px] text-center">
            <motion.div {...reveal} className="inline-flex rounded-lg border border-[#bfd1f8] bg-white px-3 py-1 text-sm font-semibold text-[#0a3aa2]">
              Official portal access
            </motion.div>
            <motion.h2 {...reveal} className="mt-5 text-4xl font-black leading-tight text-[#06132d] sm:text-5xl">
              Modernizing youth governance, one council at a time.
            </motion.h2>
            <motion.p {...reveal} className="mt-5 text-lg leading-8 text-[#24385f]/75">
              Officials can continue through the existing official portal. Staff and admin
              entry points remain hidden from the public landing page.
            </motion.p>

            <motion.div {...reveal} className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex items-center justify-center rounded-full bg-[#06132d] px-6 py-3 text-sm font-bold text-white"
              >
                Get Official Access <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-[#bfd1f8] bg-white px-6 py-3 text-sm font-bold text-[#0a3aa2]"
              >
                Ask SKTECH <MessageCircle className="ml-2 h-4 w-4" />
              </button>
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
                  className="inline-flex rounded-xl bg-[#cf2638] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_35px_-24px_rgba(207,38,56,0.9)]"
                >
                  SK Official Login
                </Link>
              </motion.div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="bg-[#06132d] px-4 py-12 text-center text-sm text-[#dbe7ff]/75 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative inline-flex before:absolute before:inset-x-0 before:bottom-0 before:top-2 before:bg-[linear-gradient(90deg,#cf2638,#f3c72b,#1452d9)] before:blur">
            <Image
              src={logoPath}
              alt="SKTECH"
              width={54}
              height={54}
              className="relative h-14 w-14 object-contain"
            />
          </div>

          <nav className="mt-7 flex flex-col gap-4 md:flex-row md:justify-center md:gap-7">
            <a href="#about">Overview</a>
            <a href="#platform">Platform</a>
            <a href="#features">Features</a>
            <a href="#security">Security</a>
          </nav>

          <p className="mx-auto mt-7 max-w-xl text-xs leading-6 text-white/40">
            SKTECH is a capstone and prototype e-governance platform. It is not an
            official government system unless formally adopted and authorized by the
            appropriate government authority.
          </p>
          <p className="mt-7 text-xs text-white/30">
            SKTECH Provincial Federation Platform
          </p>
        </div>
      </footer>

      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-6 md:right-6">
        {chatOpen ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="landing-chat-panel w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-3xl border border-[#dbe7ff] bg-white shadow-[0_24px_70px_-34px_rgba(6,19,45,0.9)]"
          >
            <div className="flex items-center justify-between bg-[#06132d] px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#f3c72b] p-2 text-[#06132d]">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-black">Ask SKTECH</p>
                  <p className="text-xs text-white/55">Local system information</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close Ask SKTECH"
                onClick={() => setChatOpen(false)}
                className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[48vh] space-y-3 overflow-y-auto px-4 py-4 sm:max-h-[360px]">
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-[#0a3aa2] text-white"
                        : "bg-[#eef4ff] text-[#06132d]"
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#edf2ff] px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendChatMessage(question)}
                    className="shrink-0 rounded-full border border-[#bfd1f8] px-3 py-1.5 text-xs font-bold text-[#0a3aa2]"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <form
                className="mt-2 flex items-center gap-2 rounded-2xl border border-[#dbe7ff] bg-[#f6f9ff] p-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendChatMessage();
                }}
              >
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask about SKTECH"
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#06132d] outline-none placeholder:text-[#24385f]/45"
                />
                <button
                  type="submit"
                  aria-label="Send question"
                  className="rounded-xl bg-[#cf2638] p-2 text-white"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setChatOpen(true)}
            aria-label="Chat Bot"
            className="landing-launcher inline-flex min-h-12 items-center gap-2 rounded-full border border-[#f3c72b]/50 bg-[#0a3aa2] px-3 py-2 text-sm font-black text-white shadow-[0_20px_45px_-24px_rgba(6,19,45,0.95)] transition hover:bg-[#06132d] sm:px-4"
          >
            <Image src={logoPath} alt="SKTECH chat bot" width={30} height={30} className="h-8 w-8 rounded-full object-contain" />
            <span>Chat Bot</span>
          </motion.button>
        )}
      </div>

      <style>{`
        .landing-page-dark .landing-hero-backdrop {
          background: radial-gradient(circle at 20% 10%, rgba(243, 199, 43, 0.12), transparent 30%), radial-gradient(circle at 75% 25%, rgba(20, 82, 217, 0.2), transparent 42%), linear-gradient(145deg, #071632 0%, #0b2855 54%, #102f62 100%);
        }

        .landing-page-dark .landing-hero-orbit {
          background: #020b1d;
          box-shadow: 0 35px 90px -42px rgba(0, 0, 0, 0.9);
        }

        .landing-page-dark .landing-hero-circle {
          border-color: rgba(191, 219, 254, 0.35);
          background: linear-gradient(135deg, #102448 0%, #123d79 42%, #8d731e 70%, #1452d9 100%);
          box-shadow: inset 0 0 70px rgba(56, 189, 248, 0.2);
        }

        .landing-page-dark .landing-status {
          border-color: rgba(243, 199, 43, 0.55);
          background: rgba(15, 32, 65, 0.94);
          color: #dbeafe;
        }

        .landing-page-dark .landing-light-surface {
          border-color: var(--glass-border);
          background-color: var(--surface);
          color: var(--foreground);
        }

        .landing-page-dark .landing-secondary {
          color: #cbd5e1;
        }

        .landing-page-dark main > section {
          color: var(--foreground);
        }

        .landing-page-dark main > section [class*="text-[#24385f]"] {
          color: #cbd5e1;
        }

        .landing-page-dark main > section [class*="border-[#e4ecff]"],
        .landing-page-dark main > section [class*="border-[#dbe7ff]"] {
          border-color: var(--glass-border);
        }

        .landing-page-dark main > section [class*="bg-[#f6f9ff]"],
        .landing-page-dark main > section [class*="bg-[#eef4ff]"] {
          background-color: var(--surface-elevated);
        }

        .landing-page-dark .landing-chat-panel {
          border-color: var(--glass-border);
          background: var(--surface-elevated);
          color: var(--foreground);
        }
      `}</style>
    </div>
  );
}
