"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import IdTemplateRenderer from "@/components/id-template/IdTemplateRenderer";
import type {
  IdTemplate,
  IdTemplateField,
  IdTemplateFieldType,
  IdTemplateSide,
  IdTemplateTextStyle,
} from "@/components/id-template/default-template";
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

type AdminTemplateResponse = {
  success?: boolean;
  template?: IdTemplate;
  templateName?: string;
};

type FieldTypeBadgeProps = {
  type: IdTemplateFieldType;
};

function FieldTypeBadge({ type }: FieldTypeBadgeProps) {
  return (
    <span className="rounded-full border border-glass-border bg-surface-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
      {type}
    </span>
  );
}

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
  const [templateState, setTemplateState] = useState<IdTemplate>(() => cloneTemplate(template));
  const [savedTemplateState, setSavedTemplateState] = useState<IdTemplate>(() => cloneTemplate(template));
  const [savedSnapshot, setSavedSnapshot] = useState(() => serializeTemplate(template));
  const [selectedId, setSelectedId] = useState<string | null>(template.sides.front.fields[0]?.id ?? null);
  const [showJson, setShowJson] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentFields = templateState.sides[side].fields;
  const selectedField = currentFields.find((field) => field.id === selectedId) ?? currentFields[0] ?? null;
  const currentFrontFields = templateState.sides.front.fields;
  const currentBackFields = templateState.sides.back.fields;
  const currentTotalFields = currentFrontFields.length + currentBackFields.length;
  const currentHasQr = [...currentFrontFields, ...currentBackFields].some((field) => field.type === "qr");

  const printableSide = useMemo(() => side, [side]);
  const currentSnapshot = useMemo(() => serializeTemplate(templateState), [templateState]);
  const isDirty = currentSnapshot !== savedSnapshot;

  useEffect(() => {
    let isMounted = true;

    const loadEditableTemplate = async () => {
      try {
        const response = await fetch("/api/admin/id-template", { cache: "no-store" });
        if (!response.ok) return;

        const result = (await response.json()) as AdminTemplateResponse;
        if (!isMounted || !result.template) return;

        const editableTemplate = cloneTemplate(result.template);
        setTemplateState(editableTemplate);
        setSavedTemplateState(cloneTemplate(editableTemplate));
        setSavedSnapshot(serializeTemplate(editableTemplate));
        setSelectedId(editableTemplate.sides.front.fields[0]?.id ?? null);
        setSide("front");
      } catch {
        if (isMounted) {
          setSaveError("Unable to load the editable template. Showing the server preview.");
        }
      }
    };

    loadEditableTemplate();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSelectedField = (patch: Partial<IdTemplateField>) => {
    if (!selectedField) return;

    setTemplateState((current) => {
      const next = cloneTemplate(current);
      const selected = next.sides[side].fields.find((field) => field.id === selectedField.id);
      if (!selected) return next;

      Object.assign(selected, patch);
      return next;
    });
    setSaveMessage(null);
    setSaveError(null);
  };

  const updateSelectedStyle = (updates: Partial<IdTemplateTextStyle> & { color?: string; align?: "left" | "center" | "right"; fontSize?: number; fontWeight?: number }) => {
    if (!selectedField) return;

    setTemplateState((current) => {
      const next = cloneTemplate(current);
      const selected = next.sides[side].fields.find((field) => field.id === selectedField.id);
      if (!selected) return next;
      selected.style = {
        ...(selected.style ?? {}),
        ...updates,
      };
      return next;
    });
    setSaveMessage(null);
    setSaveError(null);
  };

  const resetTemplate = () => {
    const savedTemplate = cloneTemplate(savedTemplateState);
    setTemplateState(savedTemplate);
    setSelectedId(savedTemplate.sides.front.fields[0]?.id ?? null);
    setSide("front");
    setSaveMessage(null);
    setSaveError(null);
  };

  const saveTemplate = async () => {
    if (!isDirty || isSaving) return;

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const response = await fetch("/api/admin/id-template", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: buildSaveFields(templateState),
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save ID template.");
      }

      const savedTemplate = cloneTemplate(templateState);
      const nextSnapshot = serializeTemplate(savedTemplate);
      setSavedTemplateState(savedTemplate);
      setSavedSnapshot(nextSnapshot);
      setSaveMessage("Template saved.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save ID template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-none space-y-4 overflow-x-hidden">
      <section className="min-w-0 rounded-2xl border border-glass-border bg-surface p-4 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              ID Template Designer
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Admin Template Editor</h2>
            <p className="mt-2 truncate text-sm text-muted">
              {templateName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isDirty ? (
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
                Unsaved changes
              </span>
            ) : null}
            <button
              type="button"
              onClick={resetTemplate}
              className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={saveTemplate}
              disabled={!isDirty || isSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Template"}
            </button>
            <Link
              href="/dashboard/admin/id-production"
              className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Back to ID Production
            </Link>
          </div>
        </div>
        {saveMessage ? (
          <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            {saveMessage}
          </p>
        ) : null}
        {saveError ? (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
            {saveError}
          </p>
        ) : null}
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-glass-border bg-surface p-4 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSide("front");
                const frontFirst = templateState.sides.front.fields[0]?.id ?? null;
                setSelectedId(frontFirst);
              }}
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
              onClick={() => {
                setSide("back");
                const backFirst = templateState.sides.back.fields[0]?.id ?? null;
                setSelectedId(backFirst);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                side === "back"
                  ? "bg-accent text-accent-foreground"
                  : "border border-glass-border text-foreground hover:bg-surface-elevated/70"
              }`}
            >
              Back
            </button>
          </div>
          <div className="max-w-full rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">
            Changes are saved only when you click Save Template.
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200">
          Changes are saved only when you click Save Template.
        </div>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_300px] 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="min-w-0 rounded-xl border border-glass-border bg-surface-elevated/50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Fields
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                {side}
              </span>
            </div>
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 lg:max-h-[620px]">
              {templateState.sides[side].fields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => setSelectedId(field.id)}
                  className={`flex min-w-0 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                    selectedField?.id === field.id
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-glass-border bg-surface-elevated/30 text-foreground hover:bg-surface-elevated/70"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold">
                      {field.sourceKey ?? field.id ?? field.type}
                    </span>
                    <span className="block truncate text-[10px] uppercase text-muted">
                      {field.type}
                    </span>
                  </span>
                  <span className="shrink-0">
                    <FieldTypeBadge type={field.type} />
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <article className="min-w-0 overflow-hidden rounded-xl border border-glass-border bg-surface-elevated/40 p-3">
            <div className="flex min-w-0 w-full max-w-full justify-center overflow-hidden">
              <div className="relative aspect-[856/540] w-full max-w-[680px] min-w-0">
                <IdTemplateRenderer
                  template={templateState}
                  data={DEMO_DATA}
                  side={printableSide}
                  className="absolute inset-0 h-full w-full"
                  editable
                  selectedFieldId={selectedField?.id ?? null}
                  onSelectField={setSelectedId}
                />
              </div>
            </div>
          </article>

          <aside className="min-w-0 rounded-xl border border-glass-border bg-surface-elevated/50 p-3 lg:col-span-2 xl:col-span-1">
            <div className="max-h-none min-w-0 overflow-y-auto pr-1 xl:max-h-[720px]">
            <div className="rounded-lg border border-glass-border bg-surface-elevated/30 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Template Metadata
              </div>
              <div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2 xl:grid-cols-1">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-muted">Template</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{templateName}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-muted">Canvas</span>
                  <span className="font-semibold text-foreground">{canvasWidth}×{canvasHeight}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-muted">Total</span>
                  <span className="font-semibold text-foreground">{currentTotalFields || totalFields}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-muted">Front</span>
                  <span className="font-semibold text-foreground">{currentFrontFields.length || frontFields}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-muted">Back</span>
                  <span className="font-semibold text-foreground">{currentBackFields.length || backFields}</span>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="text-muted">QR</span>
                  <span className="font-semibold text-foreground">{currentHasQr || hasQr ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                Selected Field
              </span>
              <button
                type="button"
                onClick={() => setShowJson((current) => !current)}
                className="rounded-lg border border-glass-border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground transition hover:bg-surface-elevated/70"
              >
                {showJson ? "Hide" : "Show"} JSON
              </button>
            </div>

            {selectedField ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-glass-border bg-surface-elevated/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      {selectedField.type}
                    </span>
                    <FieldTypeBadge type={selectedField.type} />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">
                    {selectedField.sourceKey ?? selectedField.id}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      X%
                      <input
                        className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                        inputMode="decimal"
                        type="number"
                        value={selectedField.xPercent}
                        min={0}
                        max={100}
                        onChange={(event) => updateSelectedField({ xPercent: clampPercent(event.target.valueAsNumber, selectedField.xPercent) })}
                      />
                    </label>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Y%
                      <input
                        className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                        inputMode="decimal"
                        type="number"
                        value={selectedField.yPercent}
                        min={0}
                        max={100}
                        onChange={(event) => updateSelectedField({ yPercent: clampPercent(event.target.valueAsNumber, selectedField.yPercent) })}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Width%
                      <input
                        className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                        inputMode="decimal"
                        type="number"
                        value={selectedField.widthPercent}
                        min={0}
                        max={100}
                        onChange={(event) => updateSelectedField({ widthPercent: clampPositivePercent(event.target.valueAsNumber, selectedField.widthPercent) })}
                      />
                    </label>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Height%
                      <input
                        className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                        inputMode="decimal"
                        type="number"
                        value={selectedField.heightPercent}
                        min={0}
                        max={100}
                        onChange={(event) => updateSelectedField({ heightPercent: clampPositivePercent(event.target.valueAsNumber, selectedField.heightPercent) })}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      zIndex
                      <input
                        className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                        inputMode="decimal"
                        type="number"
                        value={selectedField.zIndex ?? 0}
                        onChange={(event) => updateSelectedField({ zIndex: normalizeNumber(event.target.valueAsNumber, 0) })}
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-glass-border bg-surface-elevated px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Visible
                      <input
                        type="checkbox"
                        checked={selectedField.visible !== false}
                        onChange={(event) => updateSelectedField({ visible: event.target.checked })}
                      />
                    </label>
                  </div>

                  {(selectedField.type === "staticText" || selectedField.type === "text") ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                          Font Size
                          <input
                            className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                            type="number"
                            value={selectedField.style?.fontSize ?? 10}
                            min={1}
                            onChange={(event) => updateSelectedStyle({ fontSize: normalizeNumber(event.target.valueAsNumber, 10) })}
                          />
                        </label>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                          Font Weight
                          <input
                            className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                            type="number"
                            value={selectedField.style?.fontWeight ?? 400}
                            min={100}
                            max={900}
                            onChange={(event) => updateSelectedStyle({ fontWeight: normalizeNumber(event.target.valueAsNumber, 400) })}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                          Color
                          <input
                            className="mt-1 h-10 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-1 text-sm text-foreground"
                            type="color"
                            value={selectedField.style?.color ?? "#111827"}
                            onChange={(event) => updateSelectedStyle({ color: event.target.value })}
                          />
                        </label>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                          Text Align
                          <select
                            className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated px-2 py-2 text-sm text-foreground"
                            value={selectedField.style?.align ?? "left"}
                            onChange={(event) => updateSelectedStyle({ align: event.target.value as "left" | "center" | "right" })}
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>

                {showJson ? (
                  <details open className="rounded-xl border border-glass-border bg-surface-elevated/50 p-3">
                    <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Debug Field JSON
                    </summary>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[10px] text-foreground">
                      {JSON.stringify(selectedField, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 text-sm text-muted">No field selected.</div>
            )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function cloneTemplate(template: IdTemplate): IdTemplate {
  return JSON.parse(JSON.stringify(template));
}

function serializeTemplate(template: IdTemplate) {
  return JSON.stringify(buildSaveFields(template));
}

function buildSaveFields(template: IdTemplate) {
  return [...template.sides.front.fields, ...template.sides.back.fields].map((field) => ({
    id: field.id,
    xPercent: field.xPercent,
    yPercent: field.yPercent,
    widthPercent: field.widthPercent,
    heightPercent: field.heightPercent,
    zIndex: field.zIndex ?? 0,
    visible: field.visible !== false,
    ...(field.type === "text" || field.type === "staticText"
      ? { styleJson: sanitizeTextStyle(field.style) }
      : {}),
  }));
}

function sanitizeTextStyle(style: IdTemplateField["style"]) {
  if (!style) return undefined;

  const safeStyle: Record<string, string | number> = {};

  if (typeof style.fontSize === "number" && Number.isFinite(style.fontSize)) {
    safeStyle.fontSize = style.fontSize;
  }
  if (typeof style.fontWeight === "number" && Number.isFinite(style.fontWeight)) {
    safeStyle.fontWeight = style.fontWeight;
  }
  if (typeof style.color === "string") {
    safeStyle.color = style.color;
  }
  if (style.align === "left" || style.align === "center" || style.align === "right") {
    safeStyle.align = style.align;
  }
  if (typeof style.lineHeight === "number" && Number.isFinite(style.lineHeight)) {
    safeStyle.lineHeight = style.lineHeight;
  }
  if (typeof style.letterSpacing === "string") {
    safeStyle.letterSpacing = style.letterSpacing;
  }
  if (
    style.textTransform === "none" ||
    style.textTransform === "uppercase" ||
    style.textTransform === "lowercase" ||
    style.textTransform === "capitalize"
  ) {
    safeStyle.textTransform = style.textTransform;
  }
  if (style.fontStyle === "normal" || style.fontStyle === "italic") {
    safeStyle.fontStyle = style.fontStyle;
  }
  if (typeof style.opacity === "number" && Number.isFinite(style.opacity)) {
    safeStyle.opacity = style.opacity;
  }

  return Object.keys(safeStyle).length > 0 ? safeStyle : undefined;
}

function clampPercent(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function clampPositivePercent(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function normalizeNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return value;
}
