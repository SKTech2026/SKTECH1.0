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
  MapPin,
  MailCheck,
  QrCode,
  ShieldCheck,
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
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f3c72b] px-5 py-3 text-sm font-bold text-[#061a35] shadow-[0_16px_28px_-16px_rgba(243,199,43,0.75)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe06b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300/50 motion-reduce:transform-none motion-reduce:transition-none";
const outlineButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 motion-reduce:transform-none motion-reduce:transition-none";

export default function KKLandingPage() {
  return (
    <main
      id="top"
      className="min-h-screen overflow-x-hidden bg-[#f4f8ff] text-[#091d3b] [color-scheme:light]"
    >
      <div className="h-1 bg-[linear-gradient(90deg,#cf2638_0%,#f3c72b_34%,#1452d9_75%)]" />
      <header className="sticky top-0 z-40 border-b border-[#d9e6fa] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <Link
            href="/kk"
            aria-label="KK Portal home"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <span className="kk-brand-logos flex shrink-0 items-center -space-x-2">
              <span className="kk-brand-sk relative z-10 grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm sm:h-10 sm:w-10">
                <Image src="/assets/logos/sk-logo-new.png" alt="Sangguniang Kabataan" width={40} height={40} className="kk-brand-image h-full w-full object-contain" />
              </span>
              <span className="kk-brand-seal relative z-20 grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm sm:h-10 sm:w-10">
                <Image src="/assets/logos/official-seal-logo-new.png" alt="Oriental Mindoro" width={40} height={40} className="kk-brand-image h-full w-full object-contain" />
              </span>
              <span className="kk-brand-sktech relative z-30 grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm sm:h-10 sm:w-10">
                <Image src="/assets/logos/sktech-logo-new.png" alt="SKTECH" width={40} height={40} priority className="kk-brand-image h-full w-full object-contain" />
              </span>
            </span>
            <span className="hidden h-8 w-px bg-[#d9e6fa] sm:block" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[10px] font-black uppercase tracking-[0.12em] text-[#0a3aa2] sm:text-xs sm:tracking-[0.16em]">SKTECH · ORIENTAL MINDORO</span>
              <span className="block truncate text-sm font-bold text-[#091d3b] sm:text-base">KK Portal <span className="font-medium text-[#526684]">/ Katipunan ng Kabataan</span></span>
            </span>
          </Link>
          <nav aria-label="KK Portal sections" className="hidden items-center gap-6 whitespace-nowrap text-sm font-semibold text-[#344968] lg:flex">
            <a href="#features" className="transition hover:text-[#0a3aa2]">Services</a>
            <a href="#how-it-works" className="transition hover:text-[#0a3aa2]">How it works</a>
            <a href="#privacy" className="transition hover:text-[#0a3aa2]">Privacy</a>
            <a href="#verification" className="transition hover:text-[#0a3aa2]">Verification</a>
          </nav>
          <Link
            href="/kk/login"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#0a3aa2] px-3.5 py-2 text-xs font-bold text-white shadow-[0_12px_26px_-18px_rgba(10,58,162,0.8)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1452d9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1452d9]/30 motion-reduce:transform-none sm:min-h-11 sm:gap-2 sm:px-5 sm:text-sm"
          >
            <span className="hidden sm:inline">KK Member</span> Login <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <nav aria-label="KK Portal mobile sections" className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 pb-2 text-xs font-semibold text-[#344968] sm:px-6 lg:hidden">
          <a href="#features" className="whitespace-nowrap transition hover:text-[#0a3aa2]">Services</a>
          <a href="#how-it-works" className="whitespace-nowrap transition hover:text-[#0a3aa2]">How it works</a>
          <a href="#privacy" className="whitespace-nowrap transition hover:text-[#0a3aa2]">Privacy</a>
          <a href="#verification" className="whitespace-nowrap transition hover:text-[#0a3aa2]">Verification</a>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden bg-[#071b3a] text-white">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(120deg,#06142d_0%,#0c2f5d_58%,#102b53_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="pointer-events-none absolute right-[-14rem] top-20 -z-10 h-[34rem] w-[34rem] rounded-full border border-sky-200/10" />
        <div className="pointer-events-none absolute right-[-10rem] top-36 -z-10 h-[26rem] w-[26rem] rounded-full border border-sky-200/10" />
        <div className="absolute inset-x-0 top-0 -z-10 h-1 bg-[linear-gradient(90deg,#cf2638_0%,#f3c72b_38%,#1452d9_76%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-11 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="motion-safe:animate-[kk-rise_650ms_ease-out_both]">
            <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border border-sky-200/25 bg-white/[0.07] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100 sm:text-xs sm:tracking-[0.18em]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#f3c72b]" /> <span className="whitespace-nowrap">KATIPUNAN NG KABATAAN</span> <span className="hidden text-sky-200/55 sm:inline">/</span> <span className="whitespace-nowrap">ORIENTAL MINDORO</span>
            </p>
            <h1 className="mt-6 max-w-2xl text-[2.65rem] font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.9rem]">
              Your KK journey, <span className="text-[#f3c72b]">connected.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-sky-100/80 sm:text-lg sm:leading-8">
              One secure place for your KK profile, YouthPass, certificates, and
              participation records—through SKTECH&apos;s youth governance platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Link href="/kk/login" className={primaryButton}>
                KK Member Login <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#invitation" className={outlineButton}>
                I have an invitation <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-sky-100/70">
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5 text-sky-300" />Private member access</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-[#f3c72b]" />Invitation-based registration</span>
            </div>
          </div>

          <div
            aria-label="KK Portal preview for Oriental Mindoro members"
            className="relative mx-auto w-full max-w-[600px] motion-safe:animate-[kk-rise_750ms_120ms_ease-out_both]"
          >
            <div className="absolute -left-5 top-12 z-20 hidden items-center gap-2 rounded-full border border-[#dbe9ff] bg-white px-4 py-2.5 text-xs font-bold text-[#12315f] shadow-[0_16px_34px_-20px_rgba(0,0,0,0.7)] sm:flex motion-safe:animate-[kk-float_7s_ease-in-out_infinite]">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Member-only workspace
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 left-[8%] z-0 h-40 w-[84%] opacity-55">
              <div className="absolute inset-x-0 bottom-5 h-32 bg-[linear-gradient(180deg,rgba(137,190,231,0.2),rgba(62,125,182,0.04))] [clip-path:polygon(0_72%,8%_65%,15%_68%,22%_48%,31%_59%,39%_40%,48%_62%,56%_55%,63%_31%,72%_60%,80%_47%,91%_64%,100%_58%,100%_100%,0_100%)]" />
              <div className="absolute inset-x-0 bottom-4 h-px bg-[linear-gradient(90deg,transparent,rgba(190,222,248,0.48),transparent)]" />
            </div>
            <div className="relative z-10 overflow-hidden rounded-[28px] border border-white/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.045))] p-3 shadow-[0_34px_90px_-42px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:rounded-[32px] sm:p-4">
              <div className="flex items-center justify-between border-b border-white/15 px-2 pb-3 text-xs font-semibold text-sky-100">
                <span className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f3c72b] text-[#071b3a]"><Fingerprint className="h-4 w-4" /></span>
                  <span><span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-sky-200/65">SKTECH / KK</span><span className="block">Your member space</span></span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-200/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-100"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />SECURE ACCESS</span>
              </div>
              <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-[#dbe6f7] bg-[#f7faff] p-4 text-[#0b2a4f] sm:min-h-[302px] sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#1452d9]">REGIONAL YOUTH PORTAL</span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#dbe6f7] bg-white"><Image src="/assets/logos/official-seal-logo-new.png" alt="Oriental Mindoro seal" width={32} height={32} className="h-6 w-6 object-contain" /></span>
                  </div>
                  <div className="mt-4 flex min-h-16 items-center rounded-xl border border-[#e1e9f5] bg-white px-3 py-2.5">
                    <Image src="/assets/branding/oriental-mindoro-wordmark.png" alt="Oriental Mindoro: youth-led today, a brighter Mindoro tomorrow" width={600} height={220} className="h-auto max-h-14 w-full object-contain" />
                  </div>
                  <div className="mt-4 rounded-xl bg-[#0a2148] p-4 text-white sm:mt-5 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-200">DIGITAL MEMBER CREDENTIAL</p><p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">YouthPass</p></div>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-[#f3c72b]"><QrCode className="h-6 w-6" /></span>
                    </div>
                    <p className="mt-4 border-t border-white/15 pt-3 text-[10px] font-semibold leading-5 text-sky-100/75">Available when issued to your verified member profile.</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-4 text-[10px] font-bold text-[#435878]"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#e8f6ef] text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /></span>Private records. Verified access.</div>
                </div>
                <div className="grid gap-3 sm:content-start">
                  <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#10356c] p-4 text-white sm:p-5 motion-safe:animate-[kk-float_8s_ease-in-out_infinite]">
                    <div className="absolute right-0 top-0 h-full w-1 bg-[linear-gradient(#cf2638,#f3c72b,#1452d9)]" />
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#f3c72b]"><FileBadge2 className="h-5 w-5" /></span>
                    <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.16em] text-sky-200">ISSUED RECORDS</p>
                    <p className="mt-1 text-lg font-black">Certificates</p>
                    <p className="mt-1 text-xs leading-5 text-sky-100/70">View certificates available to your account.</p>
                  </div>
                  <div className="rounded-2xl border border-sky-200/25 bg-white/[0.08] p-4 text-white sm:p-5">
                    <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sky-200"><ClipboardList className="h-5 w-5" /></span><BadgeCheck className="h-5 w-5 text-[#f3c72b]" /></div>
                    <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-sky-200">PERSONAL PROFILE</p>
                    <p className="mt-1 text-sm font-bold">Your details, in your control</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-1 pt-3 text-[10px] font-semibold text-sky-100/65">
                <span className="inline-flex items-center gap-1.5"><Image src="/assets/logos/sk-logo-new.png" alt="Sangguniang Kabataan" width={22} height={22} className="h-5 w-5 object-contain" /> Supported by your local SK</span>
                <span>SKTECH · ORIENTAL MINDORO</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="KK Portal at a glance" className="border-b border-[#d9e6fa] bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#e3ebf7] py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            [LockKeyhole, "Invitation-led access", "Join through your authorized barangay SK."],
            [ClipboardList, "One member profile", "Keep your KK details in a protected space."],
            [BadgeCheck, "Verified youth records", "Open YouthPass and certificates when issued."],
          ].map(([Icon, title, description]) => {
            const FeatureIcon = Icon as typeof LockKeyhole;
            return (
              <div key={title as string} className="flex items-center gap-3 px-2 py-4 sm:px-5 sm:py-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf2ff] text-[#1452d9]"><FeatureIcon className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block text-sm font-bold text-[#102b53]">{title as string}</span><span className="mt-0.5 block text-xs leading-5 text-[#526684]">{description as string}</span></span>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-28 bg-[linear-gradient(180deg,#f4f8ff_0%,#edf4ff_100%)] px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
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
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        className="scroll-mt-28 border-y border-[#d9e6fa] bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
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

      <section id="privacy" className="scroll-mt-28 bg-[linear-gradient(180deg,#f4f8ff_0%,#ffffff_100%)] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
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

      <section className="bg-[linear-gradient(120deg,#061b39_0%,#0a2a59_58%,#061b39_100%)] px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8">
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
            <Link href="/verify" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1452d9] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0a3aa2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9ac0f5]">
              Open Verification Center <ArrowRight className="h-4 w-4" />
            </Link>
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
            <div className="flex items-center gap-3">
              <span className="kk-brand-logos flex shrink-0 items-center -space-x-2">
                <span className="kk-brand-sk relative grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-white bg-white"><Image src="/assets/logos/sk-logo-new.png" alt="Sangguniang Kabataan" width={32} height={32} className="kk-brand-image h-full w-full object-contain" /></span>
                <span className="kk-brand-seal relative z-10 grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-white bg-white"><Image src="/assets/logos/official-seal-logo-new.png" alt="Oriental Mindoro" width={32} height={32} className="kk-brand-image h-full w-full object-contain" /></span>
                <span className="kk-brand-sktech relative z-20 grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-white bg-white"><Image src="/assets/logos/sktech-logo-new.png" alt="SKTECH" width={32} height={32} className="kk-brand-image h-full w-full object-contain" /></span>
              </span>
              <span className="text-sm font-black tracking-[0.08em] text-[#102b53]">SKTECH · KK Portal</span>
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
            <Link href="/verify" className="hover:underline">
              Verification Center
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
      <style>{`
        .kk-brand-logos > span { overflow: hidden; }
        .kk-brand-logos img {
          position: absolute;
          left: 50%;
          top: 50%;
          max-width: none;
          height: auto;
        }
        .kk-brand-sk img { width: 129.6%; transform: translate(-50.16%, -49.45%); }
        .kk-brand-seal img { width: 129.6%; transform: translate(-50.03%, -49.73%); }
        .kk-brand-sktech img { width: 164.5%; transform: translate(-49.48%, -47.75%); }
      `}</style>
    </main>
  );
}
