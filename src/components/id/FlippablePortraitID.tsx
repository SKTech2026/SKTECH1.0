"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

import IdTemplateRenderer from "@/components/id-template/IdTemplateRenderer";
import { DEFAULT_ID_TEMPLATE } from "@/components/id-template/default-template";
import { resolveOfficialIdTemplateData } from "@/lib/id-template/resolve-official-id-data";

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
  const templateData = resolveOfficialIdTemplateData({
    fullName,
    position,
    barangay,
    municipality,
    idNumber,
    qrValue,
    photoUrl: displayPhotoUrl,
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
    registryStatus,
    accountStatus,
    sktechLogoUrl,
    skfedLogoUrl,
    provincialSealUrl,
    provinceName,
    contactInfo,
    issuedDate,
    websiteUrl,
    watermark: WATERMARK,
  });

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

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
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

  const handleTemplateImageError = (source: string) => {
    if (source === displayPhotoUrl) {
      setFailedPhotoUrl(photoUrl);
    }
  };

  const transform = `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${(tilt.y + (isFlipped ? 180 : 0)).toFixed(2)}deg)`;

  const DesktopFront = () => (
    <IdTemplateRenderer
      template={DEFAULT_ID_TEMPLATE}
      data={templateData}
      side="front"
      onImageError={handleTemplateImageError}
    />
  );

  const DesktopBack = ({ print = false }: { print?: boolean }) => (
    <IdTemplateRenderer
      template={DEFAULT_ID_TEMPLATE}
      data={templateData}
      side="back"
      print={print}
      onImageError={handleTemplateImageError}
    />
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
    <section
      className={`id-wallet-card mx-auto w-full max-w-[856px] ${
        variant === "mobileViewer" ? "id-wallet-mobile-view" : ""
      }`}
    >
      {controls ? (
        <div className="id-screen-controls mb-3 grid w-full max-w-[18rem] grid-cols-2 rounded-lg border border-white/10 bg-surface-elevated/55 p-1 text-xs font-semibold text-muted">
          <button
            type="button"
            onClick={() => setIsFlipped(false)}
            className={`rounded-md px-3 py-2 transition ${
              !isFlipped ? "bg-accent text-accent-foreground" : "hover:bg-white/10"
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className={`rounded-md px-3 py-2 transition ${
              isFlipped ? "bg-accent text-accent-foreground" : "hover:bg-white/10"
            }`}
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
            className={`id-landscape-card absolute inset-0 h-full w-full rounded-[0.72rem] outline-none [transform-style:preserve-3d] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-2 focus-visible:ring-[#f5b300] ${
              preview ? "" : "cursor-pointer"
            }`}
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
          <Link
            href={closeHref}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated px-3 text-sm font-semibold text-foreground"
          >
            Close / Back
          </Link>
          <a
            href={qrValue}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground"
          >
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

      .id-template-renderer {
        container-type: inline-size;
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
