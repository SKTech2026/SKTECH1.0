"use client";

import { QRCodeSVG } from "qrcode.react";
import { Download, MapPin, ShieldCheck, UserRound } from "lucide-react";

type YouthPassProfile = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  province?: string | null;
  youthClassification?: string | null;
  youthAgeGroup?: string | null;
  createdAt: Date | string;
  municipality?: { name: string } | null;
  barangay?: { name: string } | null;
};

type YouthPassCardProps = {
  profile: YouthPassProfile;
  verificationUrl?: string;
};

const formatStatus = (status: string) => status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const youthPassId = (id: string) => `KK-${id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;

export default function YouthPassCard({ profile, verificationUrl = `/kk/youthpass/${profile.id}` }: YouthPassCardProps) {
  const statusLabel = profile.status === "VERIFIED" ? "Verified" : profile.status === "PENDING_VERIFICATION" || profile.status === "PENDING_EMAIL_VERIFICATION" ? "Pending verification" : "Not active";
  const statusClasses = profile.status === "VERIFIED"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-[0_28px_70px_-30px_rgba(15,23,42,0.45)]">
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_35%),linear-gradient(135deg,#071a34_0%,#0d2d5f_50%,#173e7a_100%)]" />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200">Katipunan ng Kabataan</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">YouthPass</h3>
            <p className="mt-2 text-sm text-sky-100">SKTECH / Barangay {profile.barangay?.name ?? "Barangay"} KK Portal</p>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${statusClasses}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {statusLabel}
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_260px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">Full name</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{profile.firstName} {profile.lastName}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">KK Member ID</p>
                <p className="mt-2 text-base font-bold text-slate-900">{youthPassId(profile.id)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Verification status</p>
                <p className="mt-2 text-base font-bold text-slate-900">{formatStatus(profile.status)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Barangay</p>
                <p className="mt-2 text-base font-bold text-slate-900">{profile.barangay?.name ?? "Not specified"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Municipality</p>
                <p className="mt-2 text-base font-bold text-slate-900">{profile.municipality?.name ?? "Not specified"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Province</p>
                <p className="mt-2 text-base font-bold text-slate-900">{profile.province ?? "Not specified"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Youth age group</p>
                <p className="mt-2 text-base font-bold text-slate-900">{profile.youthAgeGroup ?? "Not specified"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Youth classification</p>
                <p className="mt-2 text-base font-bold text-slate-900">{profile.youthClassification ?? "Not specified"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Date registered</p>
                <p className="mt-2 text-base font-bold text-slate-900">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[24px] border border-sky-200 bg-slate-950 p-4 text-white shadow-inner shadow-sky-900/30">
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG value={verificationUrl} size={180} level="M" includeMargin />
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-sky-800 bg-sky-900/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200">YouthPass ID</p>
                <p className="mt-2 text-sm font-bold text-sky-50">{youthPassId(profile.id)}</p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-sky-800 bg-sky-900/40 p-3 text-sm text-sky-100">
                <UserRound className="h-4 w-4 text-sky-300" />
                {profile.firstName} {profile.lastName}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-sky-800 bg-sky-900/40 p-3 text-sm text-sky-100">
                <MapPin className="h-4 w-4 text-sky-300" />
                {profile.barangay?.name ?? "Barangay"}, {profile.municipality?.name ?? "Municipality"}
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-amber-300"
              >
                <Download className="h-4 w-4" />
                Download / Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
