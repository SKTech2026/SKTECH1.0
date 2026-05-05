"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

type FlippablePortraitIDProps = {
  fullName: string;
  position: string;
  barangay: string;
  municipality: string;
  termPeriod: string;
  idNumber: string;
  qrValue: string;
  photoUrl?: string;
  logoUrl?: string;
  skfedLogoUrl?: string;
  provincialSealUrl?: string;
  frontTemplateUrl?: string;
  backTemplateUrl?: string;
  provinceName?: string;
  contactInfo?: string;
  issuedDate?: string;
  className?: string;
};

const MAX_TILT = 5;
const TILT_EASING = 0.18;

const compact = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;

export default function FlippablePortraitID({
  fullName,
  position,
  barangay,
  municipality,
  termPeriod,
  idNumber,
  qrValue,
  photoUrl = "/images/default-official.svg",
  logoUrl,
  skfedLogoUrl,
  provincialSealUrl,
  provinceName = "Province of Oriental Mindoro",
  contactInfo = "SK Provincial Federation | support@skpf.gov.ph | (043) 000-0000",
  issuedDate,
  className,
}: FlippablePortraitIDProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  const federationLogo = skfedLogoUrl ?? logoUrl ?? "/sk-tech-logo.png";
  const sealLogo = provincialSealUrl ?? "/images/sk-tech-logo.png";
  const displayName = compact(fullName.toUpperCase(), 38);
  const documentId = compact(idNumber, 16);
  const issued = issuedDate ?? "Upon approval";

  const stepTilt = () => {
    const current = currentRef.current;
    const target = targetRef.current;

    current.x += (target.x - current.x) * TILT_EASING;
    current.y += (target.y - current.y) * TILT_EASING;
    setTilt({ x: current.x, y: current.y });

    if (Math.abs(target.x - current.x) < 0.04 && Math.abs(target.y - current.y) < 0.04) {
      rafRef.current = null;
      return;
    }

    rafRef.current = window.requestAnimationFrame(stepTilt);
  };

  const scheduleTiltFrame = () => {
    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(stepTilt);
    }
  };

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
    scheduleTiltFrame();
  };

  const handleMouseLeave = () => {
    targetRef.current = { x: 0, y: 0 };
    scheduleTiltFrame();
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const transform = `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${(tilt.y + (isFlipped ? 180 : 0)).toFixed(2)}deg)`;

  return (
    <div className={className ?? ""}>
      <div className="mx-auto w-full max-w-[390px] [perspective:1800px]">
        <div
          ref={cardRef}
          role="button"
          tabIndex={0}
          aria-label="Flip digital ID"
          onClick={() => setIsFlipped((previous) => !previous)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsFlipped((previous) => !previous);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative aspect-[63/100] cursor-pointer rounded-lg outline-none [transform-style:preserve-3d] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-2 focus-visible:ring-[#c9a227]"
          style={{ transform }}
        >
          <section className="official-id-face official-id-front absolute inset-0 overflow-hidden rounded-lg border border-[#d7c68b] bg-[#f8f3e6] text-[#13213b] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden]">
            <div className="official-id-pattern" />
            <div className="absolute inset-x-0 top-0 h-[7.6rem] bg-[#12315f]" />
            <div className="absolute inset-x-0 top-[7.6rem] h-2 bg-[#b3262d]" />
            <div className="absolute right-0 top-0 h-full w-12 bg-[#c9a227]" />

            <div className="relative z-10 flex h-full flex-col p-4">
              <header className="grid grid-cols-[44px_1fr_44px] items-center gap-3 text-white">
                <div className="relative h-11 w-11 rounded-md bg-white p-1.5">
                  <Image src={federationLogo} alt="SK federation logo" fill className="object-contain p-1" sizes="44px" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold leading-tight">{provinceName}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#f4d87a]">Sangguniang Kabataan Federation</p>
                </div>
                <div className="relative h-11 w-11 rounded-md bg-white p-1.5">
                  <Image src={sealLogo} alt="Provincial seal" fill className="object-contain p-1" sizes="44px" />
                </div>
              </header>

              <div className="mt-8 flex items-start gap-3">
                <div className="relative h-[148px] w-[112px] shrink-0 overflow-hidden rounded-md border-2 border-white bg-slate-100 shadow-[0_14px_28px_-18px_rgba(2,6,23,0.6)]">
                  <Image src={photoUrl} alt={`${fullName} official portrait`} fill className="object-cover" sizes="112px" priority />
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="inline-flex rounded bg-[#b3262d] px-2 py-1 text-[10px] font-bold text-white">
                    VERIFIED OFFICIAL
                  </div>
                  <h2 className="mt-3 text-[1.18rem] font-black leading-[1.05] text-[#13213b]">
                    {displayName}
                  </h2>
                  <p className="mt-2 text-xs font-semibold text-[#b3262d]">{position}</p>
                  <p className="mt-1 text-[11px] leading-snug text-[#4b5872]">
                    Barangay {barangay}
                    <br />
                    {municipality}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_76px] gap-3">
                <dl className="grid gap-2 text-[10px] text-[#44516a]">
                  <div className="rounded-md border border-[#d9cfac] bg-white/70 px-2.5 py-2">
                    <dt className="font-bold text-[#12315f]">Credential No.</dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-[#1e293b]">{documentId}</dd>
                  </div>
                  <div className="rounded-md border border-[#d9cfac] bg-white/70 px-2.5 py-2">
                    <dt className="font-bold text-[#12315f]">Term of Office</dt>
                    <dd className="mt-0.5 leading-tight">{termPeriod}</dd>
                  </div>
                </dl>

                <div className="rounded-md border border-[#d9cfac] bg-white p-1.5 shadow-sm">
                  <QRCodeSVG value={qrValue} size={64} level="M" includeMargin />
                </div>
              </div>

              <footer className="mt-auto flex items-end justify-between border-t border-[#d9cfac] pt-3">
                <div>
                  <p className="text-[9px] font-semibold text-[#12315f]">Issued</p>
                  <p className="text-[10px] text-[#4b5872]">{issued}</p>
                </div>
                <div className="relative h-10 w-10 opacity-25">
                  <Image src={sealLogo} alt="" fill className="object-contain" sizes="40px" />
                </div>
              </footer>
            </div>
          </section>

          <section className="official-id-face official-id-back absolute inset-0 overflow-hidden rounded-lg border border-[#d7c68b] bg-[#f8f3e6] text-[#13213b] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="official-id-pattern" />
            <div className="absolute inset-x-0 top-0 h-[5.8rem] bg-[#12315f]" />
            <div className="absolute left-0 top-0 h-full w-3 bg-[#b3262d]" />
            <div className="absolute right-0 top-0 h-full w-3 bg-[#c9a227]" />

            <div className="relative z-10 flex h-full flex-col p-4">
              <header className="flex items-center justify-between gap-3 text-white">
                <div>
                  <p className="text-xs font-bold">Credential Verification</p>
                  <p className="mt-1 text-[10px] text-[#f4d87a]">SKTech Governance Registry</p>
                </div>
                <div className="relative h-11 w-11 rounded-md bg-white p-1.5">
                  <Image src={federationLogo} alt="SK federation logo" fill className="object-contain p-1" sizes="44px" />
                </div>
              </header>

              <div className="mt-8 rounded-md border border-[#d9cfac] bg-white/80 p-3">
                <p className="text-[11px] leading-relaxed text-[#44516a]">
                  This digital credential certifies that the named person is recorded in the
                  SKTech official registry for the jurisdiction and term shown on the front.
                  Validity must be confirmed through the QR verification record.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-[128px_1fr] gap-4">
                <div className="rounded-md border border-[#d9cfac] bg-white p-2 shadow-sm">
                  <QRCodeSVG value={qrValue} size={112} level="M" includeMargin />
                </div>

                <dl className="grid content-start gap-2 text-[10px]">
                  <div>
                    <dt className="font-bold text-[#12315f]">Credential No.</dt>
                    <dd className="font-mono text-[#44516a]">{documentId}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[#12315f]">Official</dt>
                    <dd className="leading-tight text-[#44516a]">{compact(fullName, 34)}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-[#12315f]">Registry Contact</dt>
                    <dd className="leading-tight text-[#44516a]">{contactInfo}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-auto grid grid-cols-[1fr_92px] items-end gap-4">
                <div>
                  <div className="h-9 border-b border-[#13213b]" />
                  <p className="mt-1 text-[9px] text-[#44516a]">Authorized Federation Officer</p>
                </div>
                <div className="rounded-md bg-[#12315f] px-2 py-2 text-center text-[9px] font-semibold text-white">
                  ACTIVE REGISTRY
                </div>
              </div>
            </div>
          </section>
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
            radial-gradient(circle at 50% 18%, rgba(201, 162, 39, 0.18), transparent 28%),
            linear-gradient(135deg, rgba(18, 49, 95, 0.08) 25%, transparent 25%) 0 0 / 18px 18px,
            linear-gradient(45deg, rgba(179, 38, 45, 0.07) 25%, transparent 25%) 0 0 / 22px 22px;
          opacity: 0.78;
        }

        .official-id-face::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at var(--id-shine-x, 50%) var(--id-shine-y, 40%), rgba(255, 255, 255, 0.34), transparent 30%),
            linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.22) 49%, transparent 60%);
          opacity: 0.42;
          mix-blend-mode: soft-light;
        }
      `}</style>
    </div>
  );
}
