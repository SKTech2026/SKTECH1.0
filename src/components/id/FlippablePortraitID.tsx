"use client";

import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

type IDVariant = "full" | "dashboardPreview" | "mobilePreview" | "mobileFull" | "mobileViewer";

type FlippablePortraitIDProps = {
  fullName: string;
  position: string;
  barangay: string;
  municipality: string;
  idNumber: string;
  qrValue: string;
  photoUrl?: string;
  sitio?: string | null;
  skfedPosition?: string | null;
  dateElected?: string | null;
  termEnd?: string | null;
  termPeriod?: string;
  birthDate?: string | null;
  contactNo?: string | null;
  email?: string | null;
  address?: string | null;
  admissionStatus?: string | null;
  registryStatus?: string;
  accountStatus?: string | null;
  logoUrl?: string;
  sktechLogoUrl?: string;
  skfedLogoUrl?: string;
  provincialSealUrl?: string;
  frontTemplateUrl?: string;
  backTemplateUrl?: string;
  provinceName?: string;
  contactInfo?: string;
  issuedDate?: string;
  websiteUrl?: string;
  className?: string;
  variant?: IDVariant;
  closeHref?: string;
};

const MAX_TILT = 4;
const TILT_EASING = 0.18;
const CR80_WIDTH = 856;
const CR80_HEIGHT = 539.8;
const DEFAULT_PHOTO_URL = "/images/default-official.svg";
const WATERMARK = "CAPSTONE PROJECT \u2013 DEMO ID \u2013 NOT AN OFFICIAL GOVERNMENT ID";
const DEFAULT_CONTACT_INFO =
  "This digital identification card is part of the SKTECH college capstone prototype. Scan the QR code to verify the holder's information through the SKTECH system.";

const compact = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;

const formatDisplayDate = (value: string | null | undefined) => {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  })
    .format(parsed)
    .toUpperCase();
};

const yearLabel = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return String(parsed.getFullYear());
};

export default function FlippablePortraitID({
  fullName,
  position,
  barangay,
  municipality,
  idNumber,
  qrValue,
  photoUrl = DEFAULT_PHOTO_URL,
  sitio,
  skfedPosition,
  dateElected,
  termEnd,
  termPeriod,
  birthDate,
  contactNo,
  email,
  address,
  admissionStatus,
  registryStatus = "ACTIVE",
  accountStatus,
  sktechLogoUrl = "/assets/logos/sktech-logo-new.png",
  skfedLogoUrl = "/assets/logos/sk-logo-new.png",
  provincialSealUrl = "/assets/logos/official-seal-logo-new.png",
  provinceName = "ORIENTAL MINDORO",
  contactInfo = DEFAULT_CONTACT_INFO,
  issuedDate,
  websiteUrl = "sktech-ormin.com",
  className,
  variant = "full",
  closeHref = "/mobile/official",
}: FlippablePortraitIDProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const displayPhotoUrl = failedPhotoUrl === photoUrl ? DEFAULT_PHOTO_URL : photoUrl;
  const displayPosition = skfedPosition ? `${position} / ${skfedPosition}` : position;
  const documentId = idNumber.startsWith("SKTE-") ? idNumber : `SKTE-ORM-${idNumber}`;
  const addressLine =
    address ||
    [sitio ? `Sitio ${sitio}` : null, barangay, municipality, provinceName]
      .filter(Boolean)
      .join(", ");
  const electedYear = yearLabel(dateElected);
  const termEndYear = yearLabel(termEnd);
  const serviceTerm =
    termPeriod ?? ([electedYear, termEndYear].filter(Boolean).join("-") || "Not recorded");
  const verified = admissionStatus ? admissionStatus === "APPROVED" : registryStatus === "ACTIVE";
  const statusLabel = verified ? "Verified" : "Pending";
  const issued = issuedDate ?? "Upon registry approval";

  const startTilt = () => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(function step() {
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * TILT_EASING;
      current.y += (target.y - current.y) * TILT_EASING;
      setTilt({ x: current.x, y: current.y });

      if (Math.abs(target.x - current.x) < 0.04 && Math.abs(target.y - current.y) < 0.04) {
        rafRef.current = null;
        return;
      }

      rafRef.current = window.requestAnimationFrame(step);
    });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    targetRef.current = {
      x: (0.5 - py) * (MAX_TILT * 2),
      y: (px - 0.5) * (MAX_TILT * 2),
    };
    node.style.setProperty("--id-shine-x", `${px * 100}%`);
    node.style.setProperty("--id-shine-y", `${py * 100}%`);
    startTilt();
  };

  const transform = `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${(tilt.y + (isFlipped ? 180 : 0)).toFixed(2)}deg)`;

  const logo = (src: string, alt: string, className: string) => (
    <span className={`relative block ${className}`}>
      <Image src={src} alt={alt} fill className="object-contain" sizes="120px" />
    </span>
  );

  const photo = (sizes: string) => (
    <Image
      src={displayPhotoUrl}
      alt={`${fullName} official portrait`}
      fill
      className="object-cover"
      sizes={sizes}
      priority
      unoptimized={displayPhotoUrl.startsWith("/api/official/photo")}
      onError={() => setFailedPhotoUrl(photoUrl)}
    />
  );

  const idField = (label: string, value: string, className = "", light = false) => (
    <div className={`min-w-0 ${className}`}>
      <dt className={`text-[0.55rem] font-bold uppercase tracking-[0.12em] ${light ? "text-[#4b5563]" : "text-[#a9bdd4]"}`}>{label}</dt>
      <dd className={`mt-0.5 break-words text-[0.74rem] font-bold uppercase leading-tight tracking-wide ${light ? "text-[#111827]" : "text-white"}`}>{value}</dd>
    </div>
  );

  const DesktopFront = () => (
    <section className="id-face absolute inset-0 overflow-hidden rounded-[0.72rem] border border-[#aeb4bd] bg-[#d9d9d9] text-[#111827] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden]">
      <div className="id-front-glow" />
      <div className="relative z-10 flex h-full flex-col">
        <header className="id-reference-header flex items-center justify-between px-[2.8%] py-[1.8%]">
          {logo(provincialSealUrl, "Province of Oriental Mindoro official seal", "h-[4.6rem] w-[4.6rem]")}
          <div className="flex flex-1 items-center justify-center gap-3 text-center">
            <div>
              <h2 className="text-[1.15rem] font-black uppercase leading-none tracking-[0.25em] text-white">{provinceName}</h2>
              <p className="mt-1 text-[0.53rem] font-bold uppercase tracking-[0.1em] text-white/90">Sangguniang Kabataan Provincial Federation</p>
            </div>
          </div>
          {logo(skfedLogoUrl, "Sangguniang Kabataan logo", "h-[4.4rem] w-[5.2rem]")}
        </header>

        <div className="flex items-end justify-center border-b-[0.35rem] border-[#8c0909] px-[4.8%] pb-[1.2%] pt-[1.7%]">
          <div>
            <h3 className="text-[0.95rem] font-black uppercase tracking-[0.25em] text-[#111827]">Identification Card</h3>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[18%_1fr_18%] gap-[3%] px-[4.8%] py-[2.3%]">
          <div className="flex flex-col justify-center">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm border-2 border-black bg-white">{photo("180px")}</div>
            <p className="mt-1 text-center text-[0.48rem] font-bold uppercase tracking-[0.12em] text-[#111827]">Official portrait</p>
          </div>

          <dl className="grid content-center grid-cols-2 gap-x-5 gap-y-[0.48rem]">
            {idField("Name", compact(fullName, 30), "col-span-2", true)}
            {idField("Sex", "Not recorded", "", true)}
            {idField("Date of Birth", formatDisplayDate(birthDate), "", true)}
            {idField("Address", compact(addressLine, 45), "col-span-2", true)}
            {idField("Position", compact(displayPosition, 26), "", true)}
            {idField("Date Elected", formatDisplayDate(dateElected), "", true)}
            {idField("SKMF / SKPF Position", skfedPosition || "Not recorded", "col-span-2", true)}
            {idField("ID No.", documentId, "", true)}
            {idField("Term of Service", serviceTerm, "", true)}
          </dl>

          <div className="flex flex-col items-center justify-end pb-[5%]">
            <div className="w-full text-center"><p className="text-[0.48rem] font-bold uppercase tracking-wide text-[#111827]">Official signature</p><div className="mt-2 border-b-2 border-[#111827]" /></div>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t-[0.35rem] border-[#8c0909] bg-[#d9d9d9] px-[4.8%] py-[1.1%] text-[0.5rem] font-bold uppercase tracking-[0.08em] text-[#111827]">
          {logo(sktechLogoUrl, "SKTECH logo", "h-[2.2rem] w-[4.5rem]")}
          <span>{municipality} · {statusLabel}</span>
          <span className="absolute bottom-0 left-1/2 w-full -translate-x-1/2 translate-y-[115%] text-center text-[0.38rem] font-black tracking-[0.04em] text-[#4b5563]">{WATERMARK}</span>
        </div>
      </div>
    </section>
  );

  const DesktopBack = ({ print = false }: { print?: boolean }) => (
    <section className={`id-face absolute inset-0 overflow-hidden rounded-[0.72rem] border border-[#d4ad43] bg-[#071b3d] text-white shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden] ${print ? "" : "[transform:rotateY(180deg)]"}`}>
      <div className="id-back-bars" />
      <div className="relative z-10 grid h-full grid-cols-[24%_1fr_34%] gap-[4%] px-[5.2%] py-[5%]">
        <div className="flex flex-col items-center justify-center border-r border-[#d4ad43]/60 pr-[16%]">
          <div className="rounded-md border-4 border-white bg-white p-1"><QRCodeSVG value={qrValue} size={print ? 110 : 126} level="M" includeMargin /></div>
          <p className="mt-2 text-center text-[0.52rem] font-black uppercase tracking-[0.16em] text-[#f4d36a]">Scan to verify</p>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-3">
          <div><p className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#f4d36a]">Official identification record</p><h3 className="mt-1 text-[1.05rem] font-black uppercase tracking-[0.1em]">{provinceName} SK Federation</h3></div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            {idField("Birth Date", formatDisplayDate(birthDate))}
            {idField("Date Elected", formatDisplayDate(dateElected))}
            {idField("Term Expiration", formatDisplayDate(termEnd))}
            {idField("Account Status", accountStatus || registryStatus || "Not recorded")}
            {idField("Contact", contactNo || "Not recorded")}
            {idField("Email", email || "Not recorded")}
            {idField("Serial / ID No.", documentId, "col-span-2")}
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center border-l border-[#d4ad43]/60 pl-[12%]">
          {logo(sktechLogoUrl, "SKTECH logo", "mb-3 h-[2.4rem] w-[6rem]")}
          <p className="text-[0.62rem] leading-relaxed text-white/80">{contactInfo}</p>
          <p className="mt-3 text-[0.55rem] font-bold uppercase tracking-wide text-[#f4d36a]">{websiteUrl}</p>
          <p className="mt-1 text-[0.48rem] uppercase tracking-wide text-white/55">Issued: {issued}</p>
        </div>

        <p className="absolute bottom-[3.2%] left-1/2 z-20 w-[88%] -translate-x-1/2 text-center text-[0.46rem] font-black uppercase tracking-[0.08em] text-white/55">{WATERMARK}</p>
      </div>
    </section>
  );

  const LandscapeCard = ({
    actions = false,
    controls = true,
    preview = false,
  }: {
    actions?: boolean;
    controls?: boolean;
    preview?: boolean;
  }) => (
    <section className={`id-wallet-card mx-auto w-full max-w-[856px] ${variant === "mobileViewer" ? "id-wallet-mobile-view" : ""}`}>
      {controls ? (
        <div className="id-screen-controls mb-3 grid w-full max-w-[18rem] grid-cols-2 rounded-lg border border-white/10 bg-surface-elevated/55 p-1 text-xs font-semibold text-muted">
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className={`rounded-md px-3 py-2 transition ${!isFlipped ? "bg-accent text-accent-foreground" : "hover:bg-white/10"}`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className={`rounded-md px-3 py-2 transition ${isFlipped ? "bg-accent text-accent-foreground" : "hover:bg-white/10"}`}
          >
            Back
          </button>
        </div>
      ) : null}

      <div
        className="id-screen-card relative w-full max-w-full [perspective:1800px]"
        style={{ aspectRatio: `${CR80_WIDTH} / ${CR80_HEIGHT}` }}
      >
        <div className="id-landscape-scale absolute inset-0">
          <div
          ref={preview ? undefined : cardRef}
          role={preview ? "img" : "button"}
          tabIndex={preview ? undefined : 0}
          aria-label="Digital ID card"
          onClick={preview ? undefined : () => setIsFlipped((previous) => !previous)}
          onKeyDown={
            preview
              ? undefined
              : (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsFlipped((previous) => !previous);
                  }
                }
          }
          onMouseMove={preview ? undefined : handleMouseMove}
          onMouseLeave={
            preview
              ? undefined
              : () => {
                  targetRef.current = { x: 0, y: 0 };
                  startTilt();
                }
          }
          className={`id-landscape-card absolute inset-0 h-full w-full rounded-[0.72rem] outline-none [transform-style:preserve-3d] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-2 focus-visible:ring-[#f5b300] ${preview ? "" : "cursor-pointer"}`}
          style={{
            transform: preview ? "scale(var(--id-scale, 1))" : transform,
          }}
          >
            <DesktopFront />
            <DesktopBack />
          </div>
        </div>
      </div>

      {actions ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={closeHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated px-3 text-sm font-semibold text-foreground">
            Close / Back
          </Link>
          <a href={qrValue} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground">
            Verify QR
          </a>
        </div>
      ) : null}

      <div className="id-print-stack hidden">
        <div className="official-id-print-card relative overflow-hidden">
          <DesktopFront />
        </div>
        <div className="official-id-print-card relative overflow-hidden">
          <DesktopBack print />
        </div>
      </div>
    </section>
  );

  if (variant === "dashboardPreview" || variant === "mobilePreview") {
    return (
      <div className={className ?? ""}>
        <LandscapeCard controls={false} preview />
        <IDStyles />
      </div>
    );
  }

  if (variant === "mobileFull" || variant === "mobileViewer") {
    return (
      <div className={className ?? ""}>
        <LandscapeCard actions />
        <IDStyles />
      </div>
    );
  }

  return (
    <div className={className ?? ""}>
      <LandscapeCard />
      <IDStyles />
    </div>
  );
}

function IDStyles() {
  return (
    <style>{`
      .id-face {
        isolation: isolate;
        font-family: Arial, Helvetica, sans-serif;
      }

      .id-front-glow {
        pointer-events: none;
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 42%);
      }

      .id-reference-header {
        min-height: 19%;
        background: #071b3d;
        border-bottom: 2px solid #071b3d;
      }

      .id-front-bars,
      .id-back-bars {
        pointer-events: none;
        position: absolute;
        inset: 0;
        opacity: 0.8;
        background:
          linear-gradient(112deg, transparent 0 67%, rgba(244, 211, 106, 0.22) 67.3% 68%, transparent 68.3%),
          linear-gradient(112deg, transparent 0 72%, rgba(69, 142, 190, 0.24) 72.3% 73%, transparent 73.3%),
          linear-gradient(112deg, transparent 0 77%, rgba(244, 211, 106, 0.13) 77.3% 78%, transparent 78.3%);
      }

      .id-back-bars {
        opacity: 0.72;
        background:
          linear-gradient(90deg, rgba(244, 211, 106, 0.9) 0 1.4%, transparent 1.4% 3.2%, rgba(69, 142, 190, 0.8) 3.2% 4.2%, transparent 4.2% 96%, rgba(244, 211, 106, 0.9) 96% 97.4%, transparent 97.4%),
          linear-gradient(135deg, transparent 0 62%, rgba(244, 211, 106, 0.2) 62.3% 63%, transparent 63.3% 70%, rgba(69, 142, 190, 0.2) 70.3% 71%, transparent 71.3%);
      }

      .id-face::after {
        content: "";
        pointer-events: none;
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at var(--id-shine-x, 50%) var(--id-shine-y, 40%), rgba(255, 255, 255, 0.38), transparent 28%),
          linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.16) 49%, transparent 60%);
        opacity: 0.32;
        mix-blend-mode: soft-light;
      }

      .id-corner {
        pointer-events: none;
        position: absolute;
        z-index: 1;
      }

      .id-corner-left {
        left: -2%;
        top: -4%;
        width: 22%;
        height: 20%;
        background:
          linear-gradient(135deg, transparent 0 30%, #779bc6 30% 32%, transparent 32% 42%, #9eb4d2 42% 44%, transparent 44% 59%, #f7c600 59% 64%, transparent 64%),
          linear-gradient(135deg, transparent 0 62%, #f7c600 62% 67%, transparent 67%);
      }

      .id-corner-right {
        right: -3%;
        top: 31%;
        width: 13%;
        height: 25%;
        background:
          linear-gradient(135deg, transparent 0 30%, #f7c600 30% 38%, transparent 38% 62%, #7d8daa 62% 65%, transparent 65% 75%, #7d8daa 75% 78%, transparent 78%);
      }

      .id-dots {
        pointer-events: none;
        position: absolute;
        z-index: 1;
        bottom: 3%;
        left: 2.4%;
        width: 12%;
        height: 7%;
        background-image: radial-gradient(circle, #09235d 1.2px, transparent 1.6px);
        background-size: 9px 9px;
      }

      .id-dots::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image: radial-gradient(circle, #f7c600 1.2px, transparent 1.6px);
        background-size: 27px 9px;
        opacity: 0.85;
      }

      .id-soft-logo {
        pointer-events: none;
        position: absolute;
        z-index: 0;
      }

      @media (max-width: 640px) {
        .id-wallet-mobile-view {
          width: min(100%, calc(100vw - 2rem));
          max-width: calc(100vw - 2rem);
        }

        .id-wallet-mobile-view .id-screen-card {
          overflow: visible;
        }

        .id-wallet-mobile-view .id-landscape-scale {
          left: 50%;
          right: auto;
          bottom: auto;
          width: 856px;
          height: 539.8px;
          transform: translateX(-50%) scale(calc((100vw - 2rem) / 856px));
          transform-origin: top center;
        }

      }

      @page {
        size: 85.6mm 53.98mm;
        margin: 0;
      }

      @media print {
        body {
          background: #fff !important;
        }

        .id-screen-controls,
        .id-screen-card {
          display: none !important;
        }

        .id-print-stack {
          display: block !important;
        }

        .official-id-print-card {
          width: 85.6mm !important;
          height: 53.98mm !important;
          page-break-after: always;
          break-after: page;
        }

        .official-id-print-card .id-face {
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      }
    `}</style>
  );
}
