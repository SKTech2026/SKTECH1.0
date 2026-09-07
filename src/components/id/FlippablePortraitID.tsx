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

  const desktopRow = (label: string, value: string, valueClass = "text-[0.9rem]") => (
    <div className="grid grid-cols-[8rem_0.55rem_1fr] items-baseline gap-1 text-[0.68rem] leading-tight text-[#09235d]">
      <dt className="font-black uppercase">{label}</dt>
      <dd className="font-black">:</dd>
      <dd className={`${valueClass} min-w-0 break-words font-black uppercase tracking-wide`}>
        {value}
      </dd>
    </div>
  );

  const infoBlock = (label: string, value: string) => (
    <div className="min-w-0 rounded-xl border border-[#d5e0ed] bg-white px-3 py-2">
      <dt className="text-[0.66rem] font-black uppercase tracking-wide text-[#61728b]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold leading-snug text-[#172653]">{value}</dd>
    </div>
  );

  const DesktopFront = ({ print = false }: { print?: boolean }) => (
    <section className="id-face absolute inset-0 overflow-hidden rounded-[0.72rem] border border-[#d7c26c] bg-white text-[#09235d] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden]">
      <div className="id-corner id-corner-left" />
      <div className="id-corner id-corner-right" />
      <div className="id-dots" />
      <div className="id-soft-logo left-[5%] top-[8%] h-[38%] w-[40%]">
        <Image src={sktechLogoUrl} alt="" fill className="object-contain opacity-15" sizes="360px" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-[4.6%] py-[3.1%]">
        <header className="grid grid-cols-[1fr_1fr_1fr] items-start gap-3">
          {logo(sktechLogoUrl, "SKTECH logo", "h-[3.5rem] w-[6.3rem]")}
          {logo(provincialSealUrl, "Province of Oriental Mindoro official seal", "mx-auto h-[4.45rem] w-[4.45rem]")}
          {logo(skfedLogoUrl, "Sangguniang Kabataan logo", "ml-auto h-[4.15rem] w-[5rem]")}
        </header>

        <div className="mt-[0.42rem] text-center">
          <h2 className="text-[1.05rem] font-black uppercase leading-tight tracking-wide">
            SK Federation Identification of {provinceName}
          </h2>
          <p className="mt-1 text-[0.78rem] font-black uppercase tracking-wide text-[#f2af00]">
            SKTECH Digital Identification System
          </p>
          <div className="mx-auto mt-2 h-[0.14rem] w-[84%] bg-[#f2db84]" />
        </div>

        <div className="mt-[0.7rem] grid min-h-0 flex-1 grid-cols-[24%_1fr_18%] gap-[2.4%]">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-[#c9c9c9] bg-[#eef3f9]">
              {photo("180px")}
            </div>
            <p className="mt-1 text-center text-[0.66rem] font-black uppercase leading-tight">
              Profile Photo
            </p>
          </div>

          <dl className="grid content-start gap-[0.58rem] pt-3">
            {desktopRow("Full Name", compact(fullName.toUpperCase(), 34))}
            {desktopRow("SK Position", compact(displayPosition.toUpperCase(), 34))}
            {desktopRow("Municipality", compact(municipality.toUpperCase(), 24))}
            {desktopRow("Barangay", compact(barangay.toUpperCase(), 24))}
            <div className="grid grid-cols-[9.3rem_1fr] items-baseline gap-1 text-[0.68rem] leading-tight text-[#09235d]">
              <dt className="font-black uppercase">SKTECH ID Number</dt>
              <dd className="break-words text-[0.8rem] font-black uppercase tracking-wide">{documentId}</dd>
            </div>
            <div className="grid grid-cols-[8.4rem_1fr] items-baseline gap-2 text-[0.68rem] leading-tight text-[#09235d]">
              <dt className="font-black uppercase">Term of Service</dt>
              <dd className="text-[0.92rem] font-black uppercase tracking-wide">{serviceTerm}</dd>
            </div>
          </dl>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className={`rounded-full px-2 py-1 text-center text-[0.58rem] font-black uppercase leading-tight ${verified ? "bg-[#e8f5ef] text-[#167447]" : "bg-[#fff4d6] text-[#946700]"}`}>
              {statusLabel} Status
            </div>
            <div className="rounded-md border border-[#d6d6d6] bg-white p-1">
              <QRCodeSVG value={qrValue} size={print ? 84 : 96} level="M" includeMargin />
            </div>
            <p className="text-center text-[0.62rem] font-black uppercase tracking-wide">Scan to Verify</p>
          </div>
        </div>

        <p className="relative z-20 mt-1 text-center text-[0.47rem] font-black uppercase tracking-[0.08em] text-[#09235d]/55">
          {WATERMARK}
        </p>
      </div>
    </section>
  );

  const DesktopBack = ({ print = false }: { print?: boolean }) => (
    <section className={`id-face absolute inset-0 overflow-hidden rounded-[0.72rem] border border-[#d7c26c] bg-white text-[#172653] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden] ${print ? "" : "[transform:rotateY(180deg)]"}`}>
      <div className="id-soft-logo left-[-3%] top-[-4%] h-[38%] w-[43%]">
        <Image src={sktechLogoUrl} alt="" fill className="object-contain opacity-15" sizes="390px" />
      </div>
      <div className="id-soft-logo bottom-[-20%] right-[-8%] h-[64%] w-[43%]">
        <Image src={provincialSealUrl} alt="" fill className="object-contain opacity-20" sizes="340px" />
      </div>
      <div className="id-dots" />

      <div className="relative z-10 grid h-full grid-cols-[41%_25%_1fr] gap-[3%] px-[5.2%] py-[4.2%]">
        <dl className="grid content-start gap-2">
          {infoBlock("Birth Date", formatDisplayDate(birthDate))}
          {infoBlock("Contact Number", contactNo || "Not recorded")}
          {infoBlock("Email Address", email || "Not recorded")}
          {infoBlock("Complete Address", addressLine || "Not recorded")}
        </dl>

        <dl className="grid content-start gap-2">
          {infoBlock("Date Elected", formatDisplayDate(dateElected))}
          {infoBlock("Term Expiration", formatDisplayDate(termEnd))}
          {infoBlock("Account Status", accountStatus || registryStatus || "Not recorded")}
        </dl>

        <div className="flex min-w-0 flex-col items-center rounded-xl border border-[#d5e0ed] bg-white p-3">
          <p className="mb-2 text-center text-[0.66rem] font-black uppercase tracking-wide">
            QR Verification Code
          </p>
          <QRCodeSVG value={qrValue} size={126} level="M" includeMargin />
          <p className="mt-2 text-[0.62rem] font-medium leading-tight text-[#172653]">
            {contactInfo}
          </p>
        </div>

        <div className="absolute bottom-[8%] left-[5.2%] w-[30%]">
          <p className="text-center text-[0.62rem] font-black uppercase">Holder&apos;s Signature</p>
          <div className="mt-1 h-3 border-b-2 border-[#172653]" />
        </div>

        <div className="absolute bottom-[5%] left-1/2 flex -translate-x-1/2 items-center gap-2 text-[#172653]">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-[#f5b300]" />
          <span className="text-[0.82rem] font-black tracking-wide">{websiteUrl}</span>
        </div>

        <p className="absolute bottom-[3.2%] right-[4.2%] text-[0.5rem] font-semibold text-[#172653]">
          Issued: {issued}
        </p>
        <p className="absolute bottom-[1.6%] left-1/2 z-20 w-[88%] -translate-x-1/2 text-center text-[0.46rem] font-black uppercase tracking-[0.08em] text-[#09235d]/55">
          {WATERMARK}
        </p>
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
    <section className="mx-auto w-full max-w-[856px]">
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
            transform: preview ? undefined : transform,
          }}
        >
          <DesktopFront />
          {preview ? null : <DesktopBack />}
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
          <DesktopFront print />
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
