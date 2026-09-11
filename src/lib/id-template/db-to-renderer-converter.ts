/**
 * Convert a DB ID template to the renderer JSON format.
 *
 * This helper takes the database representation of an ID template
 * and converts it back into the code-compatible renderer format.
 */

import type {
  IdTemplate,
  IdTemplateSide,
  IdTemplateField,
  IdTemplateFieldType,
  IdTemplateTextStyle,
} from "@/components/id-template/default-template";
import type { DbIdTemplate, DbIdTemplateField } from "@/lib/id-template/load-active-id-template";

/**
 * Map database field type enum to code type string
 */
function mapDbFieldType(dbType: string): IdTemplateFieldType {
  const typeMap: Record<string, IdTemplateFieldType> = {
    STATIC_TEXT: "staticText",
    TEXT: "text",
    IMAGE: "image",
    QR: "qr",
    SHAPE: "shape",
  };

  const mapped = typeMap[dbType];
  if (!mapped) {
    console.warn(`Unknown field type in DB: ${dbType}`);
    return "text";
  }
  return mapped;
}

/**
 * Map database side enum to code side string
 */
function mapDbSide(dbSide: string): IdTemplateSide {
  if (dbSide === "FRONT") return "front";
  if (dbSide === "BACK") return "back";
  console.warn(`Unknown side in DB: ${dbSide}`);
  return "front";
}

/**
 * Convert DB field's styleJson to code's style object
 */
function parseStyleJson(styleJson: Record<string, unknown> | null): IdTemplateTextStyle | undefined {
  if (!styleJson || typeof styleJson !== "object") {
    return undefined;
  }

  const style: IdTemplateTextStyle & { background?: string; border?: string; opacity?: number } = {};

  if ("fontSize" in styleJson && typeof styleJson.fontSize === "number") {
    style.fontSize = styleJson.fontSize;
  }
  if ("fontWeight" in styleJson && typeof styleJson.fontWeight === "number") {
    style.fontWeight = styleJson.fontWeight;
  }
  if ("color" in styleJson && typeof styleJson.color === "string") {
    style.color = styleJson.color;
  }
  if ("align" in styleJson && typeof styleJson.align === "string") {
    const align = styleJson.align;
    if (align === "left" || align === "center" || align === "right") {
      style.align = align;
    }
  }
  if ("lineHeight" in styleJson && typeof styleJson.lineHeight === "number") {
    style.lineHeight = styleJson.lineHeight;
  }
  if ("letterSpacing" in styleJson && typeof styleJson.letterSpacing === "string") {
    style.letterSpacing = styleJson.letterSpacing;
  }
  if ("textTransform" in styleJson && typeof styleJson.textTransform === "string") {
    const textTransform = styleJson.textTransform;
    if (textTransform === "none" || textTransform === "uppercase" || textTransform === "lowercase" || textTransform === "capitalize") {
      style.textTransform = textTransform;
    }
  }
  if ("fontStyle" in styleJson && typeof styleJson.fontStyle === "string") {
    const fontStyle = styleJson.fontStyle;
    if (fontStyle === "normal" || fontStyle === "italic") {
      style.fontStyle = fontStyle;
    }
  }
  if ("background" in styleJson && typeof styleJson.background === "string") {
    style.background = styleJson.background;
  }
  if ("border" in styleJson && typeof styleJson.border === "string") {
    style.border = styleJson.border;
  }
  if ("opacity" in styleJson && typeof styleJson.opacity === "number") {
    style.opacity = styleJson.opacity;
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * Convert a DB field to the code renderer field format
 */
function convertDbFieldToRenderer(dbField: DbIdTemplateField): IdTemplateField {
  const field: IdTemplateField = {
    id: dbField.id,
    type: mapDbFieldType(dbField.type),
    xPercent: dbField.xPercent,
    yPercent: dbField.yPercent,
    widthPercent: dbField.widthPercent,
    heightPercent: dbField.heightPercent,
  };

  // Add optional properties only if they have meaningful values
  if (dbField.zIndex && dbField.zIndex !== 0) {
    field.zIndex = dbField.zIndex;
  }

  if (dbField.sourceKey) {
    field.sourceKey = dbField.sourceKey;
  }

  if (dbField.staticValue) {
    field.value = dbField.staticValue;
  }

  if (dbField.fit) {
    field.fit = dbField.fit as "cover" | "contain";
  }

  if (dbField.radius !== null && dbField.radius !== undefined) {
    field.radius = `${dbField.radius}rem`;
  }

  const style = parseStyleJson(dbField.styleJson);
  if (style) {
    field.style = style;
  }

  return field;
}

/**
 * Convert a DB ID template to the renderer template format.
 *
 * Returns null if the template cannot be safely converted.
 *
 * Safety:
 * - Validates all fields are present
 * - Returns null if conversion fails
 * - Handles null/undefined values gracefully
 * - Preserves field structure and styling
 */
export function convertDbTemplateToRendererTemplate(dbTemplate: DbIdTemplate | null): IdTemplate | null {
  if (!dbTemplate) {
    return null;
  }

  try {
    if (!dbTemplate.fields || dbTemplate.fields.length === 0) {
      console.warn("DB template has no fields, cannot convert");
      return null;
    }

    // Separate fields by side
    const frontFields = dbTemplate.fields
      .filter((f) => mapDbSide(f.side) === "front")
      .map((f) => convertDbFieldToRenderer(f));

    const backFields = dbTemplate.fields
      .filter((f) => mapDbSide(f.side) === "back")
      .map((f) => convertDbFieldToRenderer(f));

    // Reconstruct the renderer template
    const rendererTemplate: IdTemplate = {
      version: dbTemplate.version,
      canvas: {
        width: dbTemplate.canvasWidth,
        height: dbTemplate.canvasHeight,
      },
      sides: {
        front: {
          fields: frontFields,
        },
        back: {
          fields: backFields,
        },
      },
    };

    return rendererTemplate;
  } catch (error) {
    console.error(
      "Failed to convert DB template to renderer format:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
