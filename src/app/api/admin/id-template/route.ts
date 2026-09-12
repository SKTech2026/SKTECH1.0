import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { convertDbTemplateToRendererTemplate } from "@/lib/id-template/db-to-renderer-converter";
import type { DbIdTemplate, DbIdTemplateField } from "@/lib/id-template/load-active-id-template";
import { validateIdTemplateOrDefault } from "@/lib/id-template/validate-template";

type LayoutFieldInput = {
  id?: unknown;
  xPercent?: unknown;
  yPercent?: unknown;
  widthPercent?: unknown;
  heightPercent?: unknown;
  zIndex?: unknown;
  visible?: unknown;
  styleJson?: unknown;
};

type ValidatedLayoutField = {
  id: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  zIndex: number;
  visible: boolean;
  styleJson?: Prisma.InputJsonObject;
};

const TEXT_FIELD_TYPES = new Set(["TEXT", "STATIC_TEXT"]);
const STYLE_KEYS = new Set([
  "fontSize",
  "fontWeight",
  "color",
  "align",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "fontStyle",
  "opacity",
]);

const FONT_WEIGHTS = new Set(["normal", "medium", "semibold", "bold", "400", "500", "600", "700", "800"]);
const TEXT_TRANSFORMS = new Set(["none", "uppercase", "lowercase", "capitalize"]);
const FONT_STYLES = new Set(["normal", "italic"]);
const BASIC_COLORS = new Set([
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "gray",
  "grey",
  "transparent",
]);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readFiniteNumber(value: unknown, fieldName: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${fieldName} must be a finite number from ${min} to ${max}.`);
  }

  return value;
}

function readZIndex(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < -1000 || value > 1000) {
    throw new Error("zIndex must be an integer from -1000 to 1000.");
  }

  return value;
}

function readVisible(value: unknown) {
  if (typeof value !== "boolean") {
    throw new Error("visible must be a boolean.");
  }

  return value;
}

function isSafeSizeString(value: string, min: number, max: number) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/);
  if (!match) return false;

  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount >= min && amount <= max;
}

function isSafeColor(value: string) {
  const color = value.trim();
  if (BASIC_COLORS.has(color.toLowerCase())) return true;
  if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color)) return true;
  if (/^rgba?\(\s*(\d{1,3}\s*,\s*){2}\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(color)) return true;
  if (/^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(color)) return true;
  return false;
}

function sanitizeStyleJson(value: unknown, dbField: DbIdTemplateField): Prisma.InputJsonObject | undefined {
  if (value === undefined) return undefined;
  if (!TEXT_FIELD_TYPES.has(dbField.type)) return undefined;
  if (!isPlainObject(value)) {
    throw new Error("styleJson must be an object.");
  }

  const sanitized: Record<string, Prisma.InputJsonValue> = {};

  for (const [key, styleValue] of Object.entries(value)) {
    if (!STYLE_KEYS.has(key)) {
      throw new Error(`styleJson contains unsafe key: ${key}.`);
    }

    if (key === "fontSize") {
      if (typeof styleValue === "number") {
        sanitized.fontSize = readFiniteNumber(styleValue, "fontSize", 1, 200);
      } else if (typeof styleValue === "string" && isSafeSizeString(styleValue, 1, 200)) {
        sanitized.fontSize = styleValue.trim();
      } else {
        throw new Error("fontSize is invalid.");
      }
    }

    if (key === "fontWeight") {
      const normalized = typeof styleValue === "number" ? String(styleValue) : styleValue;
      if (typeof normalized !== "string" || !FONT_WEIGHTS.has(normalized)) {
        throw new Error("fontWeight is invalid.");
      }
      sanitized.fontWeight = typeof styleValue === "number" ? styleValue : normalized;
    }

    if (key === "color") {
      if (typeof styleValue !== "string" || !isSafeColor(styleValue)) {
        throw new Error("color is invalid.");
      }
      sanitized.color = styleValue.trim();
    }

    if (key === "align") {
      if (styleValue !== "left" && styleValue !== "center" && styleValue !== "right") {
        throw new Error("align is invalid.");
      }
      sanitized.align = styleValue;
    }

    if (key === "lineHeight") {
      if (typeof styleValue === "number") {
        sanitized.lineHeight = readFiniteNumber(styleValue, "lineHeight", 0.5, 4);
      } else if (typeof styleValue === "string" && isSafeSizeString(styleValue, 0, 200)) {
        sanitized.lineHeight = styleValue.trim();
      } else {
        throw new Error("lineHeight is invalid.");
      }
    }

    if (key === "letterSpacing") {
      if (typeof styleValue === "number") {
        sanitized.letterSpacing = readFiniteNumber(styleValue, "letterSpacing", -20, 50);
      } else if (typeof styleValue === "string" && isSafeSizeString(styleValue, -20, 50)) {
        sanitized.letterSpacing = styleValue.trim();
      } else {
        throw new Error("letterSpacing is invalid.");
      }
    }

    if (key === "textTransform") {
      if (typeof styleValue !== "string" || !TEXT_TRANSFORMS.has(styleValue)) {
        throw new Error("textTransform is invalid.");
      }
      sanitized.textTransform = styleValue;
    }

    if (key === "fontStyle") {
      if (typeof styleValue !== "string" || !FONT_STYLES.has(styleValue)) {
        throw new Error("fontStyle is invalid.");
      }
      sanitized.fontStyle = styleValue;
    }

    if (key === "opacity") {
      sanitized.opacity = readFiniteNumber(styleValue, "opacity", 0, 1);
    }
  }

  return sanitized as Prisma.InputJsonObject;
}

function validateFields(payloadFields: unknown, dbFields: DbIdTemplateField[]) {
  if (!Array.isArray(payloadFields)) {
    throw new Error("fields must be an array.");
  }

  const fieldsById = new Map(dbFields.map((field) => [field.id, field]));
  const seen = new Set<string>();

  return payloadFields.map((field): ValidatedLayoutField => {
    if (!isPlainObject(field)) {
      throw new Error("Each field must be an object.");
    }

    const input = field as LayoutFieldInput;
    if (typeof input.id !== "string" || !input.id.trim()) {
      throw new Error("Field id must be a string.");
    }

    const id = input.id.trim();
    if (seen.has(id)) {
      throw new Error("Duplicate field ids are not allowed.");
    }
    seen.add(id);

    const dbField = fieldsById.get(id);
    if (!dbField) {
      throw new Error("Submitted field does not belong to the active template.");
    }

    return {
      id,
      xPercent: readFiniteNumber(input.xPercent, "xPercent", 0, 100),
      yPercent: readFiniteNumber(input.yPercent, "yPercent", 0, 100),
      widthPercent: readFiniteNumber(input.widthPercent, "widthPercent", 0.1, 100),
      heightPercent: readFiniteNumber(input.heightPercent, "heightPercent", 0.1, 100),
      zIndex: readZIndex(input.zIndex),
      visible: readVisible(input.visible),
      styleJson: sanitizeStyleJson(input.styleJson, dbField),
    };
  });
}

function validateMergedTemplate(template: DbIdTemplate, updates: ValidatedLayoutField[]) {
  const updatesById = new Map(updates.map((field) => [field.id, field]));
  const mergedTemplate: DbIdTemplate = {
    ...template,
    fields: template.fields.map((field) => {
      const update = updatesById.get(field.id);
      if (!update) return field;

      return {
        ...field,
        xPercent: update.xPercent,
        yPercent: update.yPercent,
        widthPercent: update.widthPercent,
        heightPercent: update.heightPercent,
        zIndex: update.zIndex,
        visible: update.visible,
        styleJson: update.styleJson ?? field.styleJson,
      };
    }),
  };

  const rendererTemplate = convertDbTemplateToRendererTemplate(mergedTemplate);
  const validatedTemplate = validateIdTemplateOrDefault(rendererTemplate);

  if (!rendererTemplate || validatedTemplate === null) {
    throw new Error("Template validation failed.");
  }
}

async function findActiveTemplate() {
  return prisma.idTemplate.findFirst({
    where: {
      isActive: true,
      status: "ACTIVE",
    },
    include: {
      fields: {
        orderBy: [{ side: "asc" }, { zIndex: "asc" }, { createdAt: "asc" }],
      },
      assets: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

function buildTemplateResponse(template: DbIdTemplate) {
  const rendererTemplate = convertDbTemplateToRendererTemplate(template);
  if (!rendererTemplate) {
    throw new Error("Active ID template could not be loaded.");
  }

  const visibilityById = new Map(template.fields.map((field) => [field.id, field.visible]));
  for (const field of [...rendererTemplate.sides.front.fields, ...rendererTemplate.sides.back.fields]) {
    field.visible = visibilityById.get(field.id) ?? true;
  }

  return {
    template: validateIdTemplateOrDefault(rendererTemplate),
    templateName: template.name,
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    totalFields: template.fields.length,
    frontFields: template.fields.filter((field) => field.side === "FRONT").length,
    backFields: template.fields.filter((field) => field.side === "BACK").length,
    hasQr: template.fields.some((field) => field.type === "QR"),
  };
}

export async function GET() {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;

  try {
    const activeTemplate = await findActiveTemplate();
    if (!activeTemplate) {
      return jsonError("No active ID template found.", 404);
    }

    return NextResponse.json({
      success: true,
      ...buildTemplateResponse(activeTemplate as DbIdTemplate),
    });
  } catch {
    return jsonError("Unable to load ID template.", 500);
  }
}

export async function PATCH(request: Request) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON payload.", 400);
  }

  try {
    if (!isPlainObject(body)) {
      return jsonError("Payload must be an object.", 400);
    }

    const activeTemplate = await findActiveTemplate();

    if (!activeTemplate) {
      return jsonError("No active ID template found.", 404);
    }

    const updates = validateFields(body.fields, activeTemplate.fields as DbIdTemplateField[]);
    validateMergedTemplate(activeTemplate as DbIdTemplate, updates);

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      for (const field of updates) {
        await tx.idTemplateField.update({
          where: { id: field.id },
          data: {
            xPercent: field.xPercent,
            yPercent: field.yPercent,
            widthPercent: field.widthPercent,
            heightPercent: field.heightPercent,
            zIndex: field.zIndex,
            visible: field.visible,
            ...(field.styleJson !== undefined ? { styleJson: field.styleJson } : {}),
          },
        });
      }

      return tx.idTemplate.update({
        where: { id: activeTemplate.id },
        data: {
          updatedById: guard.session.user.id,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          updatedAt: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      updatedFieldCount: updates.length,
      templateId: updatedTemplate.id,
      updatedAt: updatedTemplate.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save ID template.";
    return jsonError(message, 400);
  }
}
