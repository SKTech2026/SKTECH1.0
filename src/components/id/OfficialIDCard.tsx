"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type OfficialIDCardProps = {
  fullName: string;
  position: string;
  barangay: string;
  municipality: string;
  termStart: Date | string;
  termEnd: Date | string;
  photoUrl: string;
  qrValue: string;
  idNumber?: string;
  provinceName?: string;
  federationLogoUrl?: string;
  watermarkUrl?: string;
  contactInfo?: string;
  className?: string;
};

const formatDate = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const compactText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;
const DEFAULT_PHOTO_URL = "/images/default-official.svg";

export default function OfficialIDCard({
  fullName,
  position,
  barangay,
  municipality,
  termStart,
  termEnd,
  photoUrl,
  qrValue,
  idNumber,
  provinceName = "PROVINCE OF ORIENTAL MINDORO",
  federationLogoUrl = "/sk-tech-logo.png",
  watermarkUrl,
  contactInfo = "SK Provincial Federation, Oriental Mindoro | support@skpf.gov.ph | (043) 000-0000",
  className,
}: OfficialIDCardProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const resolvedId = idNumber ?? qrValue.slice(-12).toUpperCase();
  const termPeriod = `${formatDate(termStart)} - ${formatDate(termEnd)}`;
  const seal = watermarkUrl ?? federationLogoUrl;
  const displayPhotoUrl = failedPhotoUrl === photoUrl ? DEFAULT_PHOTO_URL : photoUrl;

  return (
    <div className={className ?? ""}>
      <div className="id-print-grid grid gap-6 lg:grid-cols-2">
        <section className="id-card relative mx-auto w-full max-w-[560px] aspect-[1.586/1] overflow-hidden rounded-md border border-[#b89d52] bg-[#091a3a] text-white shadow-[0_10px_26px_rgba(2,8,23,0.35)]">
          <div className="absolute inset-0">
            <Image
              src={seal}
              alt="Federation seal watermark"
              fill
              className="object-contain p-6 opacity-[0.08]"
              sizes="(max-width: 640px) 100vw, 560px"
              priority
            />
          </div>

          <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
            <header className="flex items-start justify-between border-b border-[#b89d52]/40 pb-3">
              <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                <Image
                  src={federationLogoUrl}
                  alt="SK Provincial Federation logo"
                  fill
                  className="object-contain"
                  sizes="56px"
                />
              </div>

              <div className="px-3 text-center">
                <p className="text-[10px] font-semibold tracking-[0.22em] text-[#d5be78] sm:text-[11px]">
                  {provinceName}
                </p>
                <h2 className="mt-1 text-[11px] font-bold tracking-[0.22em] text-white sm:text-xs">
                  OFFICIAL IDENTIFICATION CARD
                </h2>
              </div>

              <div className="w-12 sm:w-14" />
            </header>

            <div className="mt-3 grid flex-1 grid-cols-[94px,1fr] gap-3 sm:grid-cols-[108px,1fr] sm:gap-4">
              <div>
                <div className="relative h-[122px] w-[94px] overflow-hidden rounded border border-[#b89d52]/55 bg-[#10234a] sm:h-[136px] sm:w-[108px]">
                  <Image
                    src={displayPhotoUrl}
                    alt={`${fullName} photo`}
                    fill
                    className="object-cover"
                    sizes="108px"
                    unoptimized={displayPhotoUrl.startsWith("/api/official/photo")}
                    onError={() => setFailedPhotoUrl(photoUrl)}
                  />
                </div>

                <p className="mt-2 text-[10px] font-semibold tracking-[0.12em] text-[#d5be78]">
                  ID NO. {resolvedId}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d5be78]">
                  Full Name
                </p>
                <p className="mt-0.5 truncate text-base font-extrabold leading-tight sm:text-lg">
                  {compactText(fullName.toUpperCase(), 42)}
                </p>

                <div className="mt-2 grid gap-1.5 text-[11px] sm:text-xs">
                  <p>
                    <span className="font-semibold text-[#d5be78]">Position:</span>{" "}
                    {position}
                  </p>
                  <p>
                    <span className="font-semibold text-[#d5be78]">Barangay:</span>{" "}
                    {barangay}
                  </p>
                  <p>
                    <span className="font-semibold text-[#d5be78]">Municipality:</span>{" "}
                    {municipality}
                  </p>
                  <p>
                    <span className="font-semibold text-[#d5be78]">Term Period:</span>{" "}
                    {termPeriod}
                  </p>
                </div>
              </div>
            </div>

            <footer className="mt-2 flex items-end justify-between border-t border-[#b89d52]/40 pt-2">
              <p className="text-[9px] leading-relaxed text-slate-200">
                Issued by SK Provincial Federation Governance Office
              </p>
              <div className="rounded border border-[#b89d52]/70 bg-white p-1.5">
                <QRCodeSVG value={qrValue} size={72} level="M" includeMargin />
              </div>
            </footer>
          </div>
        </section>

        <section className="id-card relative mx-auto w-full max-w-[560px] aspect-[1.586/1] overflow-hidden rounded-md border border-[#b89d52] bg-[#0b1f44] text-white shadow-[0_10px_26px_rgba(2,8,23,0.35)]">
          <div className="relative z-10 flex h-full flex-col p-4 sm:p-5">
            <header className="border-b border-[#b89d52]/40 pb-3">
              <h3 className="text-xs font-bold tracking-[0.22em] text-[#d5be78] sm:text-sm">
                CARD VERIFICATION
              </h3>
            </header>

            <div className="mt-3 grid flex-1 grid-cols-[1fr,116px] gap-4 sm:grid-cols-[1fr,136px]">
              <div className="space-y-3 text-[11px] text-slate-100 sm:text-xs">
                <div>
                  <p className="font-semibold text-[#d5be78]">Signature</p>
                  <div className="mt-6 border-b border-white/80" />
                  <p className="mt-1 text-[10px] text-slate-300 sm:text-[11px]">
                    Authorized SK Provincial Federation Official
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-[#d5be78]">Verification Instructions</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[10px] leading-relaxed text-slate-200 sm:text-[11px]">
                    <li>Scan QR code using SKTech verifier portal.</li>
                    <li>Confirm official details and status.</li>
                    <li>Report lost cards immediately to federation office.</li>
                  </ol>
                </div>

                <div>
                  <p className="font-semibold text-[#d5be78]">Federation Contact</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-200 sm:text-[11px]">
                    {contactInfo}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between">
                <div className="rounded border border-[#b89d52]/70 bg-white p-2">
                  <QRCodeSVG value={qrValue} size={116} level="M" includeMargin />
                </div>
                <p className="mt-2 text-center text-[9px] leading-snug text-slate-300 sm:text-[10px]">
                  This card is property of
                  <br />
                  SK Provincial Federation
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
