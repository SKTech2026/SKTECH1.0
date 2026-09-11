"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import IdTemplateRenderer from "@/components/id-template/IdTemplateRenderer";
import type { IdTemplate, IdTemplateSide } from "@/components/id-template/default-template";
import type { OfficialIdTemplateData } from "@/lib/id-template/resolve-official-id-data";

const DEMO_DATA: OfficialIdTemplateData = {
  fullName: "SAMPLE OFFICIAL",
  position: "SK CHAIRPERSON",
  displayPosition: "SK CHAIRPERSON",
  municipality: "NAUJAN",
  municipalityStatus: "NAUJAN - VERIFIED",
  province: "ORIENTAL MINDORO",
  provinceFederation: "ORIENTAL MINDORO SK FEDERATION",
  barangay: "DEMO BARANGAY",
  address: "DEMO BARANGAY, NAUJAN, ORIENTAL MINDORO",
  birthDate: "Not recorded",
  dateElected: "January 01, 2025",
  termEnd: "December 31, 2029",
  serviceTerm: "2025-2029",
  contactNo: "Not recorded",
  email: "sample.official@example.com",
  admissionStatus: "APPROVED",
  registryStatus: "ACTIVE",
  accountStatus: "ACTIVE",
  photoUrl: "/images/default-official.svg",
  qrValue: "template-preview",
  sktechLogoUrl: "/images/default-official.svg",
  skfedLogoUrl: "/images/default-official.svg",
  provincialSealUrl: "/images/default-official.svg",
  contactInfo: "Not recorded",
  websiteUrl: "https://example.com",
  watermark: "CAPSTONE PROJECT - DEMO ID - NOT AN OFFICIAL GOVERNMENT ID",
  idNumber: "SKTEMPLATE-PREVIEW",
  documentId: "SKTEMPLATE-PREVIEW",
  officialId: "SKTEMPLATE-PREVIEW",
  issuedLabel: "Issued: Upon registry approval",
  statusLabel: "Verified",
  skfedPosition: "SK CHAIRPERSON",
};

type IdTemplatePreviewClientProps = {
  template: IdTemplate;
  templateName: string;
  canvasWidth: number;
  canvasHeight: number;
  totalFields: number;
  frontFields: number;
  backFields: number;
  hasQr: boolean;
};

export default function IdTemplatePreviewClient({
  template,
  templateName,
  canvasWidth,
  canvasHeight,
  totalFields,
  frontFields,
  backFields,
  hasQr,
}: IdTemplatePreviewClientProps) {
  const [side, setSide] = useState<IdTemplateSide>("front");

  const printableSide = useMemo(() => side, [side]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              ID Template Designer
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">Admin Template Preview</h2>
            <p className="mt-2 text-sm text-muted">
              {templateName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/admin/id-production"
              className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Back to ID Production
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSide("front")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                side === "front"
                  ? "bg-accent text-accent-foreground"
                  : "border border-glass-border text-foreground hover:bg-surface-elevated/70"
              }`}
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => setSide("back")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                side === "back"
                  ? "bg-accent text-accent-foreground"
                  : "border border-glass-border text-foreground hover:bg-surface-elevated/70"
              }`}
            >
              Back
            </button>
          </div>
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
            Preview only. Layout editing will be added in the next phase.
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,680px)_280px]">
          <article className="rounded-2xl border border-glass-border bg-surface-elevated/40 p-4">
            <div className="relative mx-auto aspect-[856/532] w-full max-w-[680px]">
              <IdTemplateRenderer
                template={template}
                data={DEMO_DATA}
                side={printableSide}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </article>

          <aside className="rounded-2xl border border-glass-border bg-surface-elevated/50 p-5">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Template Metadata
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-glass-border pb-2">
                  <span className="text-muted">Template</span>
                  <span className="font-semibold text-foreground truncate">{templateName}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-glass-border pb-2">
                  <span className="text-muted">Canvas</span>
                  <span className="font-semibold text-foreground">{canvasWidth}×{canvasHeight}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-glass-border pb-2">
                  <span className="text-muted">Total Fields</span>
                  <span className="font-semibold text-foreground">{totalFields}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-glass-border pb-2">
                  <span className="text-muted">Front Fields</span>
                  <span className="font-semibold text-foreground">{frontFields}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-glass-border pb-2">
                  <span className="text-muted">Back Fields</span>
                  <span className="font-semibold text-foreground">{backFields}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-glass-border pb-2">
                  <span className="text-muted">QR Field</span>
                  <span className="font-semibold text-foreground">{hasQr ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
