"use client";

import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { CSSProperties } from "react";

import type { IdTemplate, IdTemplateField, IdTemplateSide } from "@/components/id-template/default-template";
import type { OfficialIdTemplateData } from "@/lib/id-template/resolve-official-id-data";

type IdTemplateRendererProps = {
  template: IdTemplate;
  data: OfficialIdTemplateData;
  side: IdTemplateSide;
  className?: string;
  print?: boolean;
  onImageError?: (source: string) => void;
};

const DEFAULT_IMAGE_URL = "/images/default-official.svg";
const EMPTY_TEXT = "";

function safeValue(value: string | undefined, fallback = EMPTY_TEXT) {
  if (value === undefined) return fallback;
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null" || text === "NaN") return fallback;
  return text;
}

function resolveFieldText(field: IdTemplateField, data: OfficialIdTemplateData) {
  if (field.type === "staticText") {
    return safeValue(field.value);
  }

  if (!field.sourceKey) {
    return EMPTY_TEXT;
  }

  return safeValue(data[field.sourceKey]);
}

function boxStyle(field: IdTemplateField): CSSProperties {
  return {
    position: "absolute",
    left: `${field.xPercent}%`,
    top: `${field.yPercent}%`,
    width: `${field.widthPercent}%`,
    height: `${field.heightPercent}%`,
    zIndex: field.zIndex ?? 0,
  };
}

function fieldTextStyle(field: IdTemplateField): CSSProperties {
  const style = field.style;
  const fontSize = style?.fontSize ?? 10;

  return {
    color: style?.color,
    fontSize: `clamp(6px, ${(fontSize / 856) * 100}cqw, ${fontSize}px)`,
    fontWeight: style?.fontWeight,
    fontStyle: style?.fontStyle,
    lineHeight: style?.lineHeight,
    letterSpacing: style?.letterSpacing,
    textAlign: style?.align,
    textTransform: style?.textTransform,
    opacity: style?.opacity,
  };
}

function renderTextField(field: IdTemplateField, data: OfficialIdTemplateData) {
  const value = resolveFieldText(field, data);

  return (
    <div
      className="flex h-full min-w-0 items-center overflow-hidden whitespace-pre-wrap break-words"
      style={fieldTextStyle(field)}
    >
      <span className="line-clamp-3 w-full">{value}</span>
    </div>
  );
}

function renderImageField(
  field: IdTemplateField,
  data: OfficialIdTemplateData,
  onImageError?: (source: string) => void,
) {
  const source = field.sourceKey ? safeValue(data[field.sourceKey], DEFAULT_IMAGE_URL) : DEFAULT_IMAGE_URL;
  const fit = field.fit ?? "contain";

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: field.style?.background,
        border: field.style?.border,
        borderRadius: field.radius,
      }}
    >
      <Image
        src={source}
        alt=""
        fill
        className={fit === "cover" ? "object-cover" : "object-contain"}
        sizes="220px"
        unoptimized={source.startsWith("/api/official/photo")}
        onError={() => onImageError?.(source)}
      />
    </div>
  );
}

function renderQrField(field: IdTemplateField, data: OfficialIdTemplateData) {
  const value = field.sourceKey ? safeValue(data[field.sourceKey], "/") : "/";

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background: field.style?.background,
        border: field.style?.border,
        borderRadius: field.radius,
      }}
    >
      <QRCodeSVG value={value} size={field.widthPercent > 17 ? 126 : 110} level="M" includeMargin />
    </div>
  );
}

function renderShapeField(field: IdTemplateField) {
  return (
    <div
      className="h-full w-full"
      style={{
        background: field.style?.background,
        border: field.style?.border,
        borderRadius: field.radius,
        opacity: field.style?.opacity,
      }}
    />
  );
}

export default function IdTemplateRenderer({
  template,
  data,
  side,
  className,
  print = false,
  onImageError,
}: IdTemplateRendererProps) {
  const fields = [...template.sides[side].fields].sort(
    (first, second) => (first.zIndex ?? 0) - (second.zIndex ?? 0),
  );

  return (
    <section
      className={`id-template-renderer id-face absolute inset-0 overflow-hidden rounded-[0.72rem] border text-[#111827] shadow-[0_28px_70px_-34px_rgba(2,6,23,0.75)] [backface-visibility:hidden] ${
        side === "front" ? "border-[#aeb4bd] bg-[#d9d9d9]" : "border-[#d4ad43] bg-[#071b3d]"
      } ${side === "back" && !print ? "[transform:rotateY(180deg)]" : ""} ${className ?? ""}`}
      style={{ containerType: "inline-size" }}
    >
      {fields.map((field) => (
        <div key={field.id} style={boxStyle(field)}>
          {field.type === "text" || field.type === "staticText"
            ? renderTextField(field, data)
            : null}
          {field.type === "image" ? renderImageField(field, data, onImageError) : null}
          {field.type === "qr" ? renderQrField(field, data) : null}
          {field.type === "shape" ? renderShapeField(field) : null}
        </div>
      ))}
    </section>
  );
}
