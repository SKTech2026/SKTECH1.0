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
  UserCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import GovernanceCommandHub from "@/components/landing/GovernanceCommandHub";
import PublicNewsFeed from "@/components/landing/PublicNewsFeed";

type ChatMessage = {
  role: "bot" | "user";
  text: string;
};

const logoPath = "/assets/logos/sktech-logo-new.png";
const skLogoPath = "/assets/logos/sk-logo-new.png";
const provincialSealPath = "/assets/logos/official-seal-logo-new.png";
const orientalMindoroWordmarkPath = "/assets/branding/oriental-mindoro-wordmark.png";

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
    <div className="landing-page min-h-screen overflow-x-hidden bg-[#f6f9ff] text-[#06132d]">
      <audio ref={getStartedAudioRef} preload="auto" src="/sounds/e-1.mp3" />
      <audio ref={loginSelectAudioRef} preload="auto" src="/sounds/e-2.mp3" />

      <header
        aria-hidden={showFloatingMenu}
        className={`sticky top-0 z-40 border-b px-4 shadow-[0_10px_30px_-26px_rgba(6,19,45,0.75)] backdrop-blur transition-[max-height,opacity,transform,padding] duration-300 sm:px-8 lg:px-10 ${
          menuOpen ? "overflow-visible" : "overflow-hidden"
        } border-[#dbe7ff] bg-white/90 text-[#06132d] ${
          showFloatingMenu
            ? "pointer-events-none max-h-0 -translate-y-full border-transparent py-0 opacity-0"
            : "max-h-24 py-2.5 opacity-100 md:py-4"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="landing-brand-logos grid shrink-0 grid-cols-[2.5rem_2.5rem_3rem] items-center gap-1 sm:grid-cols-[3.5rem_3.5rem_4.5rem] sm:gap-2">
              <span className="landing-brand-sk relative block h-10 w-10 sm:h-14 sm:w-14"><Image src={skLogoPath} alt="Sangguniang Kabataan" width={160} height={208} priority /></span>
              <span className="landing-brand-seal relative block h-10 w-10 sm:h-14 sm:w-14"><Image src={provincialSealPath} alt="Oriental Mindoro provincial seal" width={160} height={208} priority /></span>
              <span className="landing-brand-sktech relative block h-10 w-12 sm:h-14 sm:w-[4.5rem]"><Image src={logoPath} alt="SKTECH" width={240} height={310} priority /></span>
            </span>
            <span className="hidden h-8 w-px bg-[#dbe7ff] sm:block" />
            <span className="max-w-[5.5rem] text-[10px] font-black uppercase leading-tight tracking-[0.04em] text-[#0b4a24] sm:max-w-[10rem] sm:text-sm sm:tracking-[0.08em]">
              SKTECH Oriental Mindoro
            </span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm font-semibold text-[#24385f]/70 md:flex lg:gap-7">
            {navItems.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-[#1452d9]">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Link href="/official/auth" aria-label="Official Portal" className="inline-flex items-center justify-center rounded-full border border-[#bfd1f8] bg-white p-2 text-[#0a3aa2] shadow-sm">
              <UserCircle className="h-5 w-5" />
            </Link>
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg border border-[#dbe7ff] p-2 text-[#06132d] hover:bg-[#eef4ff]"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="absolute left-4 right-4 top-[calc(100%+0.35rem)] mx-auto grid max-w-md gap-1 rounded-xl border border-[#dbe7ff] bg-white p-2 text-sm font-semibold text-[#06132d] shadow-lg md:hidden">
            {navItems.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-[#eef4ff]"
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
            className="rounded-2xl border border-[#bfd1f8] bg-white/90 p-3 text-[#0a3aa2] shadow-[0_18px_40px_-24px_rgba(6,19,45,0.8)] backdrop-blur-md transition hover:bg-white"
          >
            <Compass className="h-5 w-5" />
          </button>
          {floatingMenuOpen ? (
            <motion.nav
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              aria-label="Landing page sections"
              className="mt-2 w-40 rounded-2xl border border-[#dbe7ff] bg-white/95 p-2 shadow-[0_20px_50px_-26px_rgba(6,19,45,0.8)] backdrop-blur-md"
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
                    className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#eaf2ff] text-[#0a3aa2]" : "text-[#24385f]/70 hover:bg-[#f6f9ff] hover:text-[#0a3aa2]"}`}
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
          className="landing-overview relative isolate overflow-hidden px-4 pb-10 pt-6 sm:px-8 sm:pb-16 sm:pt-10 lg:px-10"
        >
          <div className="landing-hero-backdrop absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_10%,#fff2b8_0,#fff8dd_18%,transparent_34%),radial-gradient(circle_at_75%_25%,#dce8ff_0,#eaf2ff_24%,transparent_44%),linear-gradient(145deg,#ffffff_0%,#eef5ff_44%,#dce8ff_100%)]" />
          <div className="absolute left-0 top-0 -z-10 h-1.5 w-full bg-[linear-gradient(90deg,#cf2638,#f3c72b,#1452d9)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-6 sm:gap-10 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="pt-2 md:pt-10">
              <motion.h1
                {...(reducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 24 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.62, ease: "easeOut" },
                    })}
                className="max-w-3xl text-[2.35rem] font-black leading-[0.98] text-[#0a3aa2] sm:text-5xl md:text-6xl lg:text-7xl"
              >
                <Image
                  src={orientalMindoroWordmarkPath}
                  alt="Oriental Mindoro"
                  width={900}
                  height={327}
                  priority
                  className="h-auto w-full max-w-[560px] object-contain"
                />
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
                className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap"
              >
                <Link href="/official/auth" className="inline-flex items-center justify-center rounded-full bg-[#06132d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_18px_32px_-26px_rgba(6,19,45,0.95)] transition hover:bg-[#0a3aa2] sm:px-6 sm:py-3">
                  Official Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="#news" className="inline-flex items-center justify-center rounded-full border border-[#bfd1f8] bg-white/75 px-5 py-2.5 text-sm font-bold text-[#0a3aa2] shadow-sm transition hover:bg-white sm:px-6 sm:py-3">
                  View Public Updates
                </Link>
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
              className="landing-hero-art relative mx-auto w-full max-w-[560px]"
            >
              <div className="landing-hero-orbit absolute left-1/2 -translate-x-1/2 rounded-full">
                <div aria-hidden="true" className="landing-hero-circle absolute rounded-full" />
                <div className="landing-sktech-logo absolute left-1/2 top-1/2 z-20 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
                  <Image
                    src={logoPath}
                    alt="SKTECH badge"
                    width={220}
                    height={285}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            {...(reducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 18 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.35 },
                  transition: { duration: 0.55, ease: "easeOut" },
                })}
            className="mx-auto mt-8 grid max-w-7xl overflow-hidden rounded-[1.75rem] border border-[#bfd1f8] bg-white/80 shadow-[0_24px_60px_-40px_rgba(10,58,162,0.55)] backdrop-blur sm:mt-12 lg:grid-cols-3"
          >
            <div className="relative flex gap-4 border-b border-[#dce7fb] px-5 py-5 sm:px-7 sm:py-6 lg:border-b-0 lg:border-r">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eaf2ff] text-[#1452d9]"><UserCircle className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1452d9]">01 / Register</p>
                <p className="mt-1 text-sm font-black text-[#06132d] sm:text-base">Build one trusted official record.</p>
                <p className="mt-1 text-xs leading-relaxed text-[#24385f]/70">Profiles, municipality context, and documents stay connected from the start.</p>
              </div>
            </div>
            <div className="relative flex gap-4 border-b border-[#dce7fb] px-5 py-5 sm:px-7 sm:py-6 lg:border-b-0 lg:border-r">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff4c7] text-[#a56b00]"><ShieldCheck className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a56b00]">02 / Verify</p>
                <p className="mt-1 text-sm font-black text-[#06132d] sm:text-base">Turn records into confidence.</p>
                <p className="mt-1 text-xs leading-relaxed text-[#24385f]/70">Digital IDs, QR checks, and face liveness support everyday federation work.</p>
              </div>
            </div>
            <div className="flex gap-4 px-5 py-5 sm:px-7 sm:py-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#ffe5e8] text-[#cf2638]"><BarChart3 className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#cf2638]">03 / Govern</p>
                <p className="mt-1 text-sm font-black text-[#06132d] sm:text-base">See the work move forward.</p>
                <p className="mt-1 text-xs leading-relaxed text-[#24385f]/70">Attendance, announcements, and analytics turn activity into action.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <PublicNewsFeed />

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

        <GovernanceCommandHub />

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
            id="landing-chat-panel"
            role="region"
            aria-label="Ask SKTECH chat"
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
            aria-label="Open Ask SKTECH chatbot"
            aria-expanded={false}
            aria-controls="landing-chat-panel"
            className="landing-launcher group relative inline-flex min-h-12 items-center gap-2.5 overflow-hidden rounded-2xl border border-white/70 bg-[linear-gradient(135deg,#2362dc_0%,#0a3aa2_65%,#082d78_100%)] py-2 pl-2 pr-4 text-sm font-bold text-white shadow-[0_8px_28px_-8px_rgba(10,58,162,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(10,58,162,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 motion-reduce:transform-none sm:gap-3 sm:pr-5"
          >
            <span aria-hidden="true" className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/30 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] sm:h-10 sm:w-10">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#0a3aa2] bg-[#f3c72b]" />
            </span>
            <span className="text-left leading-tight"><span className="block">Ask SKTECH</span><span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-blue-100 sm:block">Your platform guide</span></span>
            <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-px bg-[linear-gradient(90deg,#1452d9,#cf2638,#f3c72b)]" />
          </motion.button>
        )}
      </div>

      <style>{`
        .landing-page { color-scheme: light; }
        .landing-hero-art { height: calc(85vw + 116px); }
        .landing-hero-orbit {
          top: 64px;
          width: 85%;
          aspect-ratio: 1;
          isolation: isolate;
          background: conic-gradient(from 140deg, #1452d9, #5688ee 55deg, #cf2638 125deg, #ef6970 165deg, #f3c72b 235deg, #ffe788 275deg, #1452d9 360deg);
          box-shadow: 0 22px 42px -22px #1452d955, inset 0 2px 3px #ffffffb3, inset 0 -3px 5px #1452d944;
        }
        .landing-hero-orbit::before {
          content: "";
          position: absolute;
          inset: -12px;
          border-radius: inherit;
          background: conic-gradient(from 140deg, #1452d9, #cf2638, #f3c72b, #1452d9);
          filter: blur(22px);
          opacity: 0.16;
          z-index: -1;
        }
        .landing-hero-orbit::after {
          content: "";
          position: absolute;
          inset: -7px;
          border: 1px solid #ffffffb3;
          border-radius: inherit;
          pointer-events: none;
        }
        .landing-hero-circle {
          inset: 4%;
          border: 1px solid #ffffffcc;
          background: radial-gradient(ellipse at 27% 18%, #ffffffed, transparent 58%), linear-gradient(135deg, #e1ecff, #f4f7ff 46%, #fff4c7 78%, #e8f0ff);
          box-shadow: inset 0 3px 14px #1452d91a, inset 0 -2px 5px #ffffff, 0 1px 3px #1452d926;
        }
        .landing-sktech-logo { width: 58%; height: 58%; }
        .landing-brand-logos > span, .landing-sktech-logo { overflow: hidden; }
        /* Display the artwork bounds of the existing transparent PNG canvases. */
        .landing-brand-logos img, .landing-sktech-logo img {
          position: absolute;
          left: 50%;
          top: 50%;
          max-width: none;
          height: auto;
        }
        .landing-brand-seal img { width: 129.6%; transform: translate(-50.03%, -49.73%); }
        .landing-brand-sk img { width: 129.6%; transform: translate(-50.16%, -49.45%); }
        .landing-brand-sktech img { width: 164.5%; transform: translate(-49.48%, -47.75%); }
        .landing-sktech-logo img { width: 164.5%; transform: translate(-49.48%, -47.75%); filter: drop-shadow(0 5px 7px #1452d92b); }
        @media (min-width: 640px) {
          .landing-hero-art { height: 650px; }
          .landing-hero-orbit { top: 68px; }
        }
        @media (min-width: 1024px) {
          .landing-hero-art { height: auto; aspect-ratio: 560 / 670; }
        }
        @media (max-width: 359px) {
          .landing-brand-logos { grid-template-columns: 2.25rem 2.25rem 2.5rem; gap: 0; }
          .landing-brand-logos > span { max-width: 100%; }
          .landing-hero-art { height: calc(85vw + 116px); }
        }
      `}</style>
    </div>
  );
}
