import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  ChevronRight,
  ClipboardList,
  FileBadge2,
  Fingerprint,
  LockKeyhole,
  MailCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "KK Digital Profile",
    copy: "Keep your youth registry details in one secure member space.",
  },
  {
    icon: Fingerprint,
    title: "YouthPass",
    copy: "Open your verified digital youth credential when it is available.",
  },
  {
    icon: FileBadge2,
    title: "Digital Certificates",
    copy: "View certificates issued for eligible participation and activities.",
  },
  {
    icon: BellRing,
    title: "Barangay Participation",
    copy: "Stay connected to programs and updates from your barangay SK.",
  },
  {
    icon: QrCode,
    title: "Secure Verification",
    copy: "Use an issued QR code or link to check a YouthPass or certificate.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy & Consent",
    copy: "Your private profile remains behind your member account.",
  },
];

const steps = [
  [
    "01",
    "Receive your invitation",
    "Your SK Chairperson shares a unique invitation link for your barangay.",
  ],
  [
    "02",
    "Verify your email",
    "Confirm your email address through the registration flow.",
  ],
  [
    "03",
    "Complete your profile",
    "Provide the KK details requested in your secure member space.",
  ],
  [
    "04",
    "Access your records",
    "View your YouthPass and certificates when they have been issued.",
  ],
  [
    "05",
    "Stay connected",
    "Follow eligible barangay youth activities and announcements.",
  ],
] as const;

const protections = [
  "Registration starts with an invitation from an authorized SK Chairperson.",
  "Email verification helps protect member account access.",
  "Profile information is collected with consent and kept in role-protected areas.",
  "Public verification displays limited details from an issued record.",
];

const roles = [
  ["KK Member", "Manages a personal profile and views issued youth records."],
  [
    "SK Official",
    "Coordinates the barangay KK registry and member invitations.",
  ],
  ["Municipal Staff", "Reviews municipality-level operations and reporting."],
  ["Provincial Admin", "Oversees province-wide governance and analytics."],
] as const;

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f3c72b] px-5 py-3 text-sm font-bold text-[#061a35] shadow-[0_16px_28px_-16px_rgba(243,199,43,0.75)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe06b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300/50 motion-reduce:transform-none";
const outlineButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 motion-reduce:transform-none";

export default function KKLandingPage() {
  return (
    <main
      id="top"
      className="min-h-screen overflow-x-hidden bg-[#f4f8ff] text-[#091d3b] [color-scheme:light]"
    >
      <div className="h-1 bg-[linear-gradient(90deg,#cf2638_0%,#f3c72b_34%,#1452d9_75%)]" />
      <header className="sticky top-0 z-40 border-b border-[#d9e6fa] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/kk"
            aria-label="KK Portal home"
            className="flex items-center gap-2.5"
          >
            <Image
              src="/assets/logos/sktech-logo-new.png"
              alt="SKTECH"
              width={44}
              height={44}
              priority
              className="h-10 w-10 object-contain"
            />
            <span className="h-8 w-px bg-[#d9e6fa]" />
            <span className="leading-tight">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-[#0a3aa2]">
                SKTECH
              </span>
              <span className="block text-sm font-bold">KK Portal</span>
            </span>
          </Link>
          <nav
            aria-label="KK Portal sections"
            className="order-3 flex w-full gap-5 overflow-x-auto whitespace-nowrap pb-1 text-xs font-semibold text-[#344968] md:order-2 md:w-auto md:pb-0 md:text-sm"
          >
            <a href="#top" className="hover:text-[#0a3aa2]">
              Home
            </a>
            <a href="#features" className="hover:text-[#0a3aa2]">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#0a3aa2]">
              How it works
            </a>
            <a href="#privacy" className="hover:text-[#0a3aa2]">
              Privacy
            </a>
            <Link href="/kk/login" className="hover:text-[#0a3aa2]">
              Login
            </Link>
          </nav>
          <Link
            href="/kk/login"
            className="order-2 inline-flex items-center gap-2 rounded-xl bg-[#0a3aa2] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#1452d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1452d9] md:order-3 md:px-4 md:text-sm"
          >
            Member Login <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#071b3a] text-white">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_30%,rgba(25,101,207,0.48),transparent_35%),radial-gradient(circle_at_10%_85%,rgba(17,66,126,0.7),transparent_40%),linear-gradient(130deg,#06142d,#0c2f5d_72%,#102b53)]" />
        <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="pointer-events-none absolute -right-24 top-6 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl motion-safe:animate-[kk-glow_8s_ease-in-out_infinite]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="motion-safe:animate-[kk-rise_650ms_ease-out_both]">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-100">
              <Sparkles className="h-3.5 w-3.5 text-[#f3c72b]" /> Katipunan ng
              Kabataan · Oriental Mindoro
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.65rem]">
              Your digital gateway to{" "}
              <span className="text-[#f3c72b]">KK services.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-sky-100/85 sm:text-lg">
              Access your KK profile, YouthPass, certificates, and participation
              records through SKTECH&apos;s secure youth governance platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/kk/login" className={primaryButton}>
                Login as KK Member <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#invitation" className={outlineButton}>
                I have an invitation link <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-sky-100/75">
              <LockKeyhole className="h-4 w-4 shrink-0 text-sky-300" />{" "}
              Registration requires an invitation from your barangay SK
              Chairperson.
            </p>
          </div>

          <div
            aria-label="Illustration of KK Portal member features"
            className="relative mx-auto w-full max-w-[540px] motion-safe:animate-[kk-rise_750ms_120ms_ease-out_both]"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-sky-300/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-3 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-4">
              <div className="flex items-center justify-between border-b border-white/15 px-2 pb-3 text-xs font-semibold text-sky-100">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f3c72b]" /> KK
                  Member Space
                </span>
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <div className="relative overflow-hidden rounded-2xl border border-sky-300/35 bg-[linear-gradient(145deg,#175ac1,#092b6a_65%,#071b3a)] p-5">
                  <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border border-white/15" />
                  <div className="absolute -right-2 -top-4 h-28 w-28 rounded-full border border-white/15" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-100">
                      SKTECH · KK
                    </span>
                    <BadgeCheck className="h-5 w-5 text-[#f3c72b]" />
                  </div>
                  <div className="mt-10 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200">
                        Digital credential
                      </p>
                      <p className="mt-1 text-2xl font-black">YouthPass</p>
                    </div>
                    <QrCode className="h-12 w-12 text-white/80" />
                  </div>
                  <p className="mt-8 border-t border-white/20 pt-3 text-[10px] font-medium tracking-[0.14em] text-sky-100">
                      AVAILABLE AFTER PROFILE VERIFICATION
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/95 p-4 text-[#0b2a4f]">
                    <FileBadge2 className="h-6 w-6 text-[#1452d9]" />
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#51688c]">
                      Member records
                    </p>
                    <p className="mt-1 text-lg font-black">Certificates</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-[#e9f4ff] p-4 text-[#0b2a4f]">
                    <ClipboardList className="h-6 w-6 text-[#1452d9]" />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#51688c]">
                      Your profile
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      Complete at your pace
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <span className="absolute -bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-[#0b2a4f] shadow-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Private
              member access
            </span>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-28 px-4 py-18 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0a3aa2]">
              Built for KK members
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              One place for your youth records.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#435878] sm:text-base">
              A clear path from invitation to verified access, with the tools
              you need for your barangay participation.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="group rounded-[24px] border border-[#d9e6fa] bg-white p-6 shadow-[0_14px_36px_-28px_rgba(6,27,58,0.5)] transition duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_24px_42px_-25px_rgba(20,82,217,0.35)]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f1ff] text-[#1452d9] transition group-hover:bg-[#1452d9] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#526684]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-28 border-y border-[#d9e6fa] bg-white px-4 py-18 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0a3aa2]">
              From invitation to access
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              How the KK Portal works
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#435878] sm:text-base">
              Your barangay SK starts the process. You complete the steps that
              follow in your own account.
            </p>
          </div>
          <ol className="mt-9 grid gap-4 md:grid-cols-5">
            {steps.map(([number, title, copy]) => (
              <li
                key={number}
                className="relative rounded-2xl border border-[#d9e6fa] bg-[#f6f9ff] p-5"
              >
                <span className="text-xs font-black tracking-[0.16em] text-[#1452d9]">
                  {number}
                </span>
                <h3 className="mt-4 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#526684]">{copy}</p>
              </li>
            ))}
          </ol>
          <div
            id="invitation"
            className="mt-8 scroll-mt-28 rounded-2xl border border-[#b9d2f7] bg-[#eaf3ff] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5"
          >
            <div>
              <p className="font-bold">Have an invitation?</p>
              <p className="mt-1 text-sm leading-6 text-[#435878]">
                Open the unique link sent by your SK Chairperson. It contains
                the code needed to join; there is no public sign-up form.
              </p>
            </div>
            <MailCheck className="mt-4 h-9 w-9 shrink-0 text-[#1452d9] sm:mt-0" />
          </div>
        </div>
      </section>

      <section id="privacy" className="scroll-mt-28 px-4 py-18 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0a3aa2]">
              Privacy by design
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Your information stays in the right hands.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#435878] sm:text-base">
              KK access is linked to your barangay invitation. Member
              information stays in protected workspaces; public verification is
              limited to the details shown by an issued record.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#c5d8f5] bg-white px-4 py-2 text-xs font-bold text-[#0a3aa2]">
              <LockKeyhole className="h-4 w-4" /> No private dashboard data on
              this page
            </div>
          </div>
          <div className="grid gap-3">
            {protections.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl border border-[#d9e6fa] bg-white p-4 shadow-sm"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f6ef] text-[#11814a]">
                  <Check className="h-4 w-4" />
                </span>
                <p className="text-sm leading-6 text-[#344968]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#061b39] px-4 py-18 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
              Connected governance
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Youth participation, supported at every level.
            </h2>
            <p className="mt-4 text-sm leading-7 text-sky-100/75">
              Each role has a distinct workspace and responsibility within
              SKTECH.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map(([role, copy], index) => (
              <article
                key={role}
                className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm"
              >
                <span className="text-xs font-bold text-[#f3c72b]">
                  0{index + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{role}</h3>
                <p className="mt-2 text-sm leading-6 text-sky-100/70">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="verification" className="px-4 py-18 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[28px] border border-[#d9e6fa] bg-white p-6 shadow-[0_26px_60px_-40px_rgba(6,27,58,0.4)] md:grid-cols-[0.75fr_1.25fr] md:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0a3aa2]">
              Public verification
            </p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Check an issued record
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#526684]">
              YouthPass and certificate verification pages open from the QR code
              or link on the issued record. No private account details are
              required for that public check.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#d9e6fa] bg-[#f4f8ff] p-5">
              <QrCode className="h-7 w-7 text-[#1452d9]" />
              <h3 className="mt-4 font-bold">YouthPass</h3>
              <p className="mt-2 text-sm leading-6 text-[#526684]">
                Scan the YouthPass QR code or open its issued verification link.
              </p>
            </div>
            <div className="rounded-2xl border border-[#d9e6fa] bg-[#f4f8ff] p-5">
              <FileBadge2 className="h-7 w-7 text-[#1452d9]" />
              <h3 className="mt-4 font-bold">Certificate</h3>
              <p className="mt-2 text-sm leading-6 text-[#526684]">
                Scan the certificate QR code or open its issued verification
                link.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,#0b377c,#1452d9)] p-7 text-white sm:p-10">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffe381]">
                Ready when you are
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Ready to access your KK Portal?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">
                Sign in with your verified member account, or open the
                invitation link shared by your SK Chairperson to begin.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
              <Link href="/kk/login" className={primaryButton}>
                KK Member Login <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#invitation" className={outlineButton}>
                Invitation guidance <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d9e6fa] bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/logos/sktech-logo-new.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <span className="text-sm font-black tracking-[0.1em]">
                SKTECH · KK Portal
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#526684]">
              A digital space for Katipunan ng Kabataan access and Oriental
              Mindoro youth governance.
            </p>
            <p className="mt-3 text-xs leading-5 text-[#64758f]">
              SKTECH is a capstone and prototype platform, not an official
              government system unless formally adopted and authorized.
            </p>
          </div>
          <div className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm font-semibold text-[#0a3aa2]">
            <Link href="/kk/login" className="hover:underline">
              KK Member Login
            </Link>
            <a href="https://sktech-ormin.com/" className="hover:underline">
              Back to SKTECH
            </a>
            <a href="#privacy" className="hover:underline">
              Privacy
            </a>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-[#e4ecf9] pt-5 text-xs text-[#64758f]">
          Member profiles stay behind role-protected access. Public verification
          shows only the details available from an issued record.
        </div>
      </footer>
    </main>
  );
}
