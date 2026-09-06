"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

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
  variant?: "full" | "mobilePreview";
};

const MAX_TILT = 4;
const TILT_EASING = 0.18;
const DEFAULT_PHOTO_URL = "/images/default-official.svg";
const WATERMARK = "CAPSTONE PROJECT – DEMO ID – NOT AN OFFICIAL GOVERNMENT ID";

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
  contactInfo = "This digital identification card is part of the SKTECH college capstone prototype. Scan the QR code to verify the holder's information through the SKTECH system.",
  issuedDate,
  websiteUrl = "sktech-ormin.com",
  className,
  variant = "full",
}: FlippablePortraitIDProps) {
  const isMobilePreview = variant === "mobilePreview";
  const [isFlipped, setIsFlipped] = useState(false);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [previewScale, setPreviewScale] = useState(1);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const displayPhotoUrl = failedPhotoUrl === photoUrl ? DEFAULT_PHOTO_URL : photoUrl;
  const displayName = compact(fullName.toUpperCase(), 34);
  const displayPosition = skfedPosition ? `${position} / ${skfedPosition}` : position;
  const documentId = `SKTE-ORM-${compact(idNumber, 16)}`;
  const addressLine =
    address ||
    [sitio ? `Sitio ${sitio}` : null, barangay, municipality, provinceName]
      .filter(Boolean)
      .join(", ");
  const electedYear = yearLabel(dateElected);
  const termEndYear = yearLabel(termEnd);
  const serviceTerm =
    termPeriod ?? ([electedYear, termEndYear].filter(Boolean).join("-") || "Not recorded");
  const verified = admissionStatus === "APPROVED" || registryStatus === "ACTIVE";
  const statusLabel = verified ? "VERIFIED STATUS" : "PENDING STATUS";
  const issued = issuedDate ?? "Upon registry approval";
  const verificationNote = compact(contactInfo, 92);

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
    if (!isMobilePreview || !previewFrameRef.current) return;
    const frame = previewFrameRef.current;
    const updateScale = () => setPreviewScale(Math.min(1, frame.clientWidth / 760));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [isMobilePreview]);

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

  const LogoMark = ({
    src,
    alt,
    className: logoClassName = "",
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    <span className={`relative block ${logoClassName}`}>
      <Image src={src} alt={alt} fill className="object-contain" sizes="96px" />
    </span>
  );

  const FieldRow = ({
    label,
    value,
    strong = true,
  }: {
    label: string;
    value: string;
    strong?: boolean;
  }) => (
    <div className="grid grid-cols-[7.4rem_0.55rem_1fr] items-baseline gap-1 text-[0.68rem] leading-tight text-[#09235d]">
      <dt className="font-black uppercase">{label}</dt>
      <dd className="font-black">:</dd>
      <dd className={strong ? "text-[0.86rem] font-black uppercase tracking-wide" : "font-semibold"}>
        {value}
      </dd>
    </div>
  );

  const BackField = ({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value: string;
  }) => (
    <div className="grid grid-cols-[2rem_1fr] gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md text-[1.35rem] text-[#f5b300]">
        {icon}
      </span>
      <div>
        <dt className="text-[0.68rem] font-black uppercase tracking-wide text-[#172653]">{label}</dt>
        <dd className="mt-1 text-[0.82rem] font-bold leading-tight text-[#172653]">{value}</dd>
      </div>
    </div>
  );

  const FrontFace = ({ print = false }: { print?: boolean }) => (
    <section className="official-id-face official-id-front absolute inset-0 overflow-hidden rounded-[0.72rem] border border-[#c9d6e7] bg-[#f7faff] text-[#09235d] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden]">

      <div className="relative z-10 flex h-full flex-col px-[4.7%] py-[3.2%]">
        <header className="official-id-topbar grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg bg-[#09235d] px-3 py-2.5 text-white">
          <LogoMark src={sktechLogoUrl} alt="SKTECH logo" className="h-[2.7rem] w-[5.5rem]" />
          <div className="flex min-w-0 items-center justify-center gap-2 text-center">
            <LogoMark src={provincialSealUrl} alt="Province of Oriental Mindoro official seal" className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[0.72rem] font-black uppercase tracking-[0.08em]">{provinceName}</p>
              <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#f6ca4a]">SK Federation Digital ID</p>
            </div>
          </div>
          <LogoMark src={skfedLogoUrl} alt="Sangguniang Kabataan logo" className="h-[3rem] w-[3.6rem]" />
        </header>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-[24%_1fr_18%] gap-3">
          <div className="official-id-photo-panel rounded-lg border border-[#d5e0ed] bg-white p-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[#e8eef6]">
              <Image
                src={displayPhotoUrl}
                alt={`${fullName} official portrait`}
                fill
                className="object-cover"
                sizes="180px"
                priority
                unoptimized={displayPhotoUrl.startsWith("/api/official/photo")}
                onError={() => setFailedPhotoUrl(photoUrl)}
              />
            </div>
            <p className="mt-1.5 text-center text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#61728b]">Profile Photo</p>
          </div>

          <dl className="official-id-detail-panel grid content-start gap-2 rounded-lg border border-[#d5e0ed] bg-white p-3">
            <FieldRow label="Full Name" value={displayName} />
            <FieldRow label="SK Position" value={compact(displayPosition.toUpperCase(), 34)} />
            <FieldRow label="Municipality" value={compact(municipality.toUpperCase(), 24)} />
            <FieldRow label="Barangay" value={compact(barangay.toUpperCase(), 24)} />
            <div className="mt-0.5 grid grid-cols-[9.2rem_1fr] items-center gap-2 text-[0.68rem] leading-tight text-[#09235d]">
              <dt className="font-black uppercase">SKTECH ID Number</dt>
              <dd className="font-black uppercase tracking-wide">{documentId}</dd>
            </div>
            <div className="grid grid-cols-[8.4rem_1fr] items-center gap-2 text-[0.68rem] leading-tight text-[#09235d]">
              <dt className="font-black uppercase">Term of Service</dt>
              <dd className="text-[0.92rem] font-black uppercase tracking-wide">{serviceTerm}</dd>
            </div>
          </dl>

          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#d5e0ed] bg-white p-2">
            <div className={`rounded-full px-2 py-1 text-center text-[0.52rem] font-black uppercase tracking-[0.08em] ${verified ? "bg-[#e8f5ef] text-[#167447]" : "bg-[#fff4d6] text-[#946700]"}`}>
              {statusLabel}
            </div>
            <div className="rounded-md border border-[#d6d6d6] bg-white p-1">
              <QRCodeSVG value={qrValue} size={print ? 84 : 96} level="M" includeMargin />
            </div>
            <p className="text-center text-[0.62rem] font-black uppercase tracking-wide">Scan to Verify</p>
          </div>
        </div>
        <p className="official-id-watermark mt-2 text-center">{WATERMARK}</p>
      </div>
    </section>
  );

  const BackFace = () => (
    <section className="official-id-face official-id-back absolute inset-0 overflow-hidden rounded-[0.72rem] border border-[#c9d6e7] bg-[#f7faff] text-[#172653] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden] [transform:rotateY(180deg)]">

      <div className="relative z-10 grid h-full grid-cols-[1.1fr_0.9fr_1fr] gap-3 px-[5.2%] py-[4.5%]">
        <dl className="official-id-detail-panel self-start grid content-start gap-2 rounded-lg border border-[#d5e0ed] bg-white p-3">
          <BackField icon="▣" label="Birth Date" value={formatDisplayDate(birthDate)} />
          <BackField icon="○" label="Contact Number" value={contactNo || "Not recorded"} />
          <BackField icon="✉" label="Email Address" value={email || "Not recorded"} />
          <BackField icon="●" label="Complete Address" value={addressLine || "Not recorded"} />
        </dl>

        <dl className="official-id-detail-panel self-start grid content-start gap-2 rounded-lg border border-[#d5e0ed] bg-white p-3">
          <BackField icon="▰" label="Date Elected" value={formatDisplayDate(dateElected)} />
          <BackField icon="◷" label="Term Expiration" value={formatDisplayDate(termEnd)} />
          <BackField icon="◆" label="Account Status" value={accountStatus || registryStatus || "Not recorded"} />
        </dl>

        <div className="self-start flex min-w-0 flex-col items-center rounded-lg border border-[#d5e0ed] bg-white p-3">
          <p className="mb-2 text-center text-[0.62rem] font-black uppercase tracking-[0.08em]">
            QR Verification Code
          </p>
          <div className="rounded-md bg-white p-1.5">
            <QRCodeSVG value={qrValue} size={128} level="M" includeMargin />
          </div>
          <p className="mt-2 w-full text-center text-[0.62rem] font-medium leading-tight text-[#61728b]">
            {verificationNote}
          </p>
        </div>

        <div className="absolute bottom-[8%] left-[5.2%] w-[30%]">
          <p className="text-center text-[0.58rem] font-black uppercase tracking-[0.1em]">Holder&apos;s Signature</p>
          <div className="mt-1 h-3 border-b-2 border-[#172653]" />
        </div>

        <div className="absolute bottom-[5%] left-1/2 flex -translate-x-1/2 items-center gap-3 text-[#172653]">
          <span className="text-[1.2rem] text-[#f5b300]">◎</span>
          <span className="text-[0.82rem] font-black tracking-wide">{websiteUrl}</span>
        </div>

        <p className="absolute bottom-[3.2%] right-[4.2%] text-[0.52rem] font-semibold text-[#172653]">
          Issued: {issued}
        </p>
      </div>
    </section>
  );

  return (
    <div className={className ?? ""}>
      <div className={`mx-auto w-full ${isMobilePreview ? "max-w-[760px]" : "max-w-[920px]"}`}>
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

        <div
          ref={previewFrameRef}
          className={`id-screen-card [perspective:1800px] ${isMobilePreview ? "id-mobile-preview-frame overflow-hidden" : ""}`}
          style={isMobilePreview ? { height: `${540 * previewScale}px` } : undefined}
        >
          <div
            ref={cardRef}
            role="button"
            tabIndex={0}
            aria-label="Digital ID card"
            onClick={() => setIsFlipped((previous) => !previous)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsFlipped((previous) => !previous);
              }
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              targetRef.current = { x: 0, y: 0 };
              startTilt();
            }}
            className={`relative aspect-[856/540] cursor-pointer rounded-[0.72rem] outline-none [transform-style:preserve-3d] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-2 focus-visible:ring-[#f5b300] ${isMobilePreview ? "id-mobile-preview-card" : "w-full"}`}
            style={{
              transform: isMobilePreview ? `scale(${previewScale}) ${transform}` : transform,
            }}
          >
            <FrontFace />
            <BackFace />
          </div>
        </div>

        <div className="id-print-stack hidden">
          <div className="official-id-print-card relative aspect-[856/540] overflow-hidden">
            <FrontFace print />
          </div>
          <div className="official-id-print-card relative aspect-[856/540] overflow-hidden">
            <BackFace />
          </div>
        </div>
      </div>

      <style>{`
        .official-id-face {
          isolation: isolate;
          font-family: Arial, Helvetica, sans-serif;
        }

        .official-id-face::after {
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

        .official-id-corner {
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        .official-id-corner-top-left {
          left: -2%;
          top: -4%;
          width: 22%;
          height: 20%;
          background:
            linear-gradient(135deg, transparent 0 30%, #779bc6 30% 32%, transparent 32% 42%, #9eb4d2 42% 44%, transparent 44% 59%, #f7c600 59% 64%, transparent 64%),
            linear-gradient(135deg, transparent 0 62%, #f7c600 62% 67%, transparent 67%);
        }

        .official-id-corner-right {
          right: -3%;
          top: 31%;
          width: 13%;
          height: 25%;
          background:
            linear-gradient(135deg, transparent 0 30%, #f7c600 30% 38%, transparent 38% 62%, #7d8daa 62% 65%, transparent 65% 75%, #7d8daa 75% 78%, transparent 78%);
        }

        .official-id-dot-grid {
          pointer-events: none;
          position: absolute;
          z-index: 1;
          width: 12%;
          height: 7%;
          background-image: radial-gradient(circle, #09235d 1.2px, transparent 1.6px);
          background-size: 9px 9px;
        }

        .official-id-dot-grid::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #f7c600 1.2px, transparent 1.6px);
          background-size: 27px 9px;
          opacity: 0.85;
        }

        .official-id-dot-grid-front,
        .official-id-dot-grid-back {
          bottom: 3%;
          left: 2.4%;
        }

        .official-id-subtle-logo,
        .official-id-seal-watermark {
          pointer-events: none;
          position: absolute;
          z-index: 0;
        }

        .official-id-subtle-logo-left {
          left: 4%;
          top: 7%;
          width: 40%;
          height: 38%;
          opacity: 0.4;
        }

        .official-id-subtle-logo-back {
          left: -2%;
          top: -3%;
          width: 43%;
          height: 34%;
          opacity: 0.42;
        }

        .official-id-seal-watermark {
          right: -9%;
          bottom: -22%;
          width: 44%;
          height: 64%;
          opacity: 0.7;
        }

        .official-id-back-divider {
          position: absolute;
          left: 43%;
          top: 7%;
          bottom: 33%;
          width: 2px;
          background: #f2db84;
        }

        .official-id-watermark {
          color: rgba(9, 35, 93, 0.42);
          font-size: 0.48rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-align: center;
          text-transform: uppercase;
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .official-id-face {
            font-size: clamp(0.52rem, 1.55vw, 1rem);
          }
        }

        @page {
          size: 85.6mm 54mm;
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
            height: 54mm !important;
            page-break-after: always;
            break-after: page;
          }

          .official-id-print-card .official-id-face {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
