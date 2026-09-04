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
  termPeriod?: string;
  registryStatus?: string;
  logoUrl?: string;
  sktechLogoUrl?: string;
  skfedLogoUrl?: string;
  provincialSealUrl?: string;
  frontTemplateUrl?: string;
  backTemplateUrl?: string;
  provinceName?: string;
  contactInfo?: string;
  issuedDate?: string;
  className?: string;
};

const MAX_TILT = 4;
const TILT_EASING = 0.18;
const DEFAULT_PHOTO_URL = "/images/default-official.svg";

const compact = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;

const formatDisplayDate = (value: string | null | undefined) => {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
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
  termPeriod,
  registryStatus = "ACTIVE",
  logoUrl,
  sktechLogoUrl,
  skfedLogoUrl,
  provincialSealUrl,
  provinceName = "Province of Oriental Mindoro",
  contactInfo = "SK Provincial Federation Registry | Oriental Mindoro",
  issuedDate,
  className,
}: FlippablePortraitIDProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const sktechLogo = sktechLogoUrl ?? logoUrl ?? "/sk-tech-logo.png";
  const federationLogo = skfedLogoUrl ?? "/login-logo.png";
  const sealLogo = provincialSealUrl ?? "/images/provincial-seal-logo.png";
  const displayPhotoUrl = failedPhotoUrl === photoUrl ? DEFAULT_PHOTO_URL : photoUrl;
  const displayName = compact(fullName.toUpperCase(), 42);
  const documentId = compact(idNumber, 18);
  const issued = issuedDate ?? "Upon registry approval";
  const statusIsActive = registryStatus === "ACTIVE";

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

  return (
    <div className={className ?? ""}>
      <div className="mx-auto w-full max-w-[390px]">
        <div className="mb-3 grid grid-cols-2 rounded-lg border border-white/10 bg-surface-elevated/55 p-1 text-xs font-semibold text-muted">
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

        <div className="[perspective:1800px]">
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
            className="relative aspect-[63/100] cursor-pointer rounded-lg outline-none [transform-style:preserve-3d] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-2 focus-visible:ring-[#c8a24a]"
            style={{ transform }}
          >
            <section className="official-id-face absolute inset-0 overflow-hidden rounded-lg border border-[#c8a24a] bg-[#f8fafc] text-[#12213b] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden]">
              <div className="official-id-pattern" />
              <div className="absolute inset-x-0 top-0 h-[7.35rem] bg-[#102b56]" />
              <div className="absolute inset-x-0 top-[7.35rem] h-1.5 bg-[#c8a24a]" />

              <div className="relative z-10 flex h-full flex-col p-4">
                <header className="grid grid-cols-[46px_1fr_46px] items-center gap-3 text-white">
                  <div className="relative h-11 w-11 rounded-md bg-white p-1.5">
                    <Image src={sktechLogo} alt="SKTECH logo placeholder" fill className="object-contain p-1" sizes="44px" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase leading-tight">{provinceName}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#f2d786]">SK Federation Digital Credential</p>
                  </div>
                  <div className="relative h-11 w-11 rounded-md bg-white p-1.5">
                    <Image src={sealLogo} alt="Oriental Mindoro logo placeholder" fill className="object-contain p-1" sizes="44px" />
                  </div>
                </header>

                <div className="mt-7 flex items-start gap-3">
                  <div className="relative h-[145px] w-[112px] shrink-0 overflow-hidden rounded-md border-2 border-white bg-slate-100 shadow-[0_14px_28px_-18px_rgba(2,6,23,0.6)]">
                    <Image
                      src={displayPhotoUrl}
                      alt={`${fullName} official portrait`}
                      fill
                      className="object-cover"
                      sizes="112px"
                      priority
                      onError={() => setFailedPhotoUrl(photoUrl)}
                    />
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide text-white ${
                        statusIsActive ? "bg-[#157347]" : "bg-[#9f1239]"
                      }`}
                    >
                      {registryStatus}
                    </span>
                    <h2 className="mt-3 text-[1.16rem] font-black leading-[1.05] text-[#12213b]">
                      {displayName}
                    </h2>
                    <p className="mt-2 text-xs font-extrabold uppercase text-[#9c7426]">{position}</p>
                    {skfedPosition ? (
                      <p className="mt-1 text-[10px] font-semibold uppercase text-[#102b56]">
                        {skfedPosition}
                      </p>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-[1fr_82px] gap-3">
                  <div className="grid gap-2 text-[10px] text-[#44516a]">
                    <div className="rounded-md border border-[#d9cfac] bg-white/80 px-2.5 py-2">
                      <dt className="font-bold text-[#102b56]">Jurisdiction</dt>
                      <dd className="mt-0.5 leading-tight">
                        {barangay}, {municipality}
                        {sitio ? <span className="block">Sitio {sitio}</span> : null}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border border-[#d9cfac] bg-white/80 px-2 py-2">
                        <dt className="font-bold text-[#102b56]">Credential No.</dt>
                        <dd className="mt-0.5 font-mono text-[10px]">{documentId}</dd>
                      </div>
                      <div className="rounded-md border border-[#d9cfac] bg-white/80 px-2 py-2">
                        <dt className="font-bold text-[#102b56]">Date Elected</dt>
                        <dd className="mt-0.5 leading-tight">{formatDisplayDate(dateElected ?? termPeriod)}</dd>
                      </div>
                    </div>
                  </div>

                  <div className="self-end rounded-md border border-[#d9cfac] bg-white p-1.5 shadow-sm">
                    <QRCodeSVG value={qrValue} size={70} level="M" includeMargin />
                  </div>
                </dl>

                <footer className="mt-auto flex items-end justify-between border-t border-[#d9cfac] pt-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase text-[#102b56]">Issued</p>
                    <p className="text-[10px] text-[#4b5872]">{issued}</p>
                  </div>
                  <div className="relative h-10 w-10 opacity-35">
                    <Image src={federationLogo} alt="SK Federation logo placeholder" fill className="object-contain" sizes="40px" />
                  </div>
                </footer>
              </div>
            </section>

            <section className="official-id-face absolute inset-0 overflow-hidden rounded-lg border border-[#c8a24a] bg-[#f8fafc] text-[#12213b] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="official-id-pattern" />
              <div className="absolute inset-x-0 top-0 h-[5.9rem] bg-[#102b56]" />
              <div className="absolute inset-x-0 top-[5.9rem] h-1.5 bg-[#c8a24a]" />

              <div className="relative z-10 flex h-full flex-col p-4">
                <header className="flex items-center justify-between gap-3 text-white">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">Credential Verification</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#f2d786]">SKTECH secure registry record</p>
                  </div>
                  <div className="relative h-11 w-11 rounded-md bg-white p-1.5">
                    <Image src={sktechLogo} alt="SKTECH logo placeholder" fill className="object-contain p-1" sizes="44px" />
                  </div>
                </header>

                <div className="mt-8 rounded-md border border-[#d9cfac] bg-white/85 p-3">
                  <p className="text-[11px] leading-relaxed text-[#44516a]">
                    This credential is valid only when the QR verification record matches the
                    official name, credential number, jurisdiction, and active registry status.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-[126px_1fr] gap-4">
                  <div className="rounded-md border border-[#d9cfac] bg-white p-2 shadow-sm">
                    <QRCodeSVG value={qrValue} size={110} level="M" includeMargin />
                  </div>

                  <dl className="grid content-start gap-2 text-[10px]">
                    <div>
                      <dt className="font-bold text-[#102b56]">Credential No.</dt>
                      <dd className="font-mono text-[#44516a]">{documentId}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-[#102b56]">Official</dt>
                      <dd className="leading-tight text-[#44516a]">{compact(fullName, 34)}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-[#102b56]">Registry Status</dt>
                      <dd className={statusIsActive ? "font-bold text-[#157347]" : "font-bold text-[#9f1239]"}>
                        {registryStatus}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-[#102b56]">Registry Contact</dt>
                      <dd className="leading-tight text-[#44516a]">{contactInfo}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-auto grid grid-cols-[1fr_88px] items-end gap-4">
                  <div>
                    <div className="h-9 border-b border-[#12213b]" />
                    <p className="mt-1 text-[9px] text-[#44516a]">Authorized registry officer</p>
                  </div>
                  <div className="relative h-16">
                    <Image src={sealLogo} alt="Oriental Mindoro logo placeholder" fill className="object-contain opacity-55" sizes="88px" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <style>{`
        .official-id-face {
          isolation: isolate;
        }

        .official-id-pattern {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 16%, rgba(200, 162, 74, 0.16), transparent 28%),
            linear-gradient(135deg, rgba(16, 43, 86, 0.07) 25%, transparent 25%) 0 0 / 18px 18px,
            linear-gradient(45deg, rgba(200, 162, 74, 0.08) 25%, transparent 25%) 0 0 / 24px 24px;
          opacity: 0.76;
        }

        .official-id-face::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at var(--id-shine-x, 50%) var(--id-shine-y, 40%), rgba(255, 255, 255, 0.34), transparent 30%),
            linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.18) 49%, transparent 60%);
          opacity: 0.38;
          mix-blend-mode: soft-light;
        }
      `}</style>
    </div>
  );
}
