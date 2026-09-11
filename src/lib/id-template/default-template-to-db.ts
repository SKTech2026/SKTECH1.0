/**
 * Helper to convert DEFAULT_ID_TEMPLATE code structure to database format.
 * This is used by the default template importer to create IdTemplate records.
 */

import type {
  IdTemplate as CodeIdTemplate,
  IdTemplateField as CodeIdTemplateField,
  IdTemplateSide,
} from "@/components/id-template/default-template";
import { IdTemplateFieldType, IdTemplateSide as DbIdTemplateSide } from "@prisma/client";

export interface DbFieldInput {
  side: DbIdTemplateSide;
  type: IdTemplateFieldType;
  sourceKey: string | null;
  staticValue: string | null;
  label: string | null;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  zIndex: number;
  fit: string | null;
  radius: number | null;
  styleJson: Record<string, unknown> | null;
}

/**
 * Map code field type to database enum
 */
function mapFieldType(
  codeType: "staticText" | "text" | "image" | "qr" | "shape"
): IdTemplateFieldType {
  const typeMap: Record<"staticText" | "text" | "image" | "qr" | "shape", IdTemplateFieldType> = {
    staticText: "STATIC_TEXT",
    text: "TEXT",
    image: "IMAGE",
    qr: "QR",
    shape: "SHAPE",
  };
  return typeMap[codeType];
}

/**
 * Map code side to database enum
 */
function mapSide(codeSide: IdTemplateSide): DbIdTemplateSide {
  return codeSide === "front" ? "FRONT" : "BACK";
}

/**
 * Convert a code field to database field format
 */
export function convertField(
  codeField: CodeIdTemplateField,
  side: IdTemplateSide
): DbFieldInput {
  const dbSide = mapSide(side);
  const dbType = mapFieldType(codeField.type);

  return {
    side: dbSide,
    type: dbType,
    sourceKey: codeField.sourceKey || null,
    staticValue: codeField.value || null,
    label: null,
    xPercent: codeField.xPercent,
    yPercent: codeField.yPercent,
    widthPercent: codeField.widthPercent,
    heightPercent: codeField.heightPercent,
    zIndex: codeField.zIndex ?? 0,
    fit: codeField.fit || null,
    radius: codeField.radius ? parseFloat(codeField.radius) : null,
    styleJson: codeField.style ? JSON.parse(JSON.stringify(codeField.style)) : null,
  };
}

/**
 * Extract all fields from the code template
 */
export function extractFields(template: CodeIdTemplate): Array<DbFieldInput> {
  const fields: DbFieldInput[] = [];

  // Process front side
  for (const field of template.sides.front.fields) {
    fields.push(convertField(field, "front"));
  }

  // Process back side
  for (const field of template.sides.back.fields) {
    fields.push(convertField(field, "back"));
  }

  return fields;
}

/**
 * Count fields by side
 */
export function countFieldsBySide(fields: DbFieldInput[]): Record<string, number> {
  return {
    FRONT: fields.filter((f) => f.side === "FRONT").length,
    BACK: fields.filter((f) => f.side === "BACK").length,
  };
}

/**
 * Check if QR field exists
 */
export function hasQrField(fields: DbFieldInput[]): boolean {
  return fields.some((f) => f.type === "QR");
}
