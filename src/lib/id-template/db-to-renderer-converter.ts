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
import { buildIdTemplateAssetUrl } from "@/lib/id-template/id-template-asset-storage";
import type { DbIdTemplate, DbIdTemplateAsset, DbIdTemplateField } from "@/lib/id-template/load-active-id-template";

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
 * Convert a DB field's styleJson to code's style object
 */
function parseStyleJson(styleJson: Record<string, unknown> | null): IdTemplateTextStyle & { background?: string; backgroundColor?: string; fill?: string; color?: string; borderColor?: string; borderWidth?: number; borderRadius?: number; border?: string; opacity?: number; imageZoom?: number; objectPositionX?: number; objectPositionY?: number } | undefined {
  if (!styleJson || typeof styleJson !== "object") {
    return undefined;
  }

  const style: IdTemplateTextStyle & { background?: string; backgroundColor?: string; fill?: string; color?: string; borderColor?: string; borderWidth?: number; borderRadius?: number; border?: string; opacity?: number; imageZoom?: number; objectPositionX?: number; objectPositionY?: number } = {};

  if ("fontSize" in styleJson && typeof styleJson.fontSize === "number") {
    style.fontSize = styleJson.fontSize;
  }
  if ("fontWeight" in styleJson) {
    const weight = styleJson.fontWeight;
    if (typeof weight === "number" && Number.isFinite(weight) && Number.isInteger(weight) && weight >= 100 && weight <= 900 && weight % 100 === 0) {
      style.fontWeight = String(weight);
    } else if (typeof weight === "string") {
      const trimmed = weight.trim();
      if (["normal", "bold", "lighter", "bolder", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(trimmed)) {
        style.fontWeight = trimmed;
      }
    }
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
  if ("backgroundColor" in styleJson && typeof styleJson.backgroundColor === "string") {
    style.backgroundColor = styleJson.backgroundColor;
    style.background = styleJson.backgroundColor;
  }
  if ("fill" in styleJson && typeof styleJson.fill === "string") {
    style.fill = styleJson.fill;
    style.background = styleJson.fill;
  }
  if ("color" in styleJson && typeof styleJson.color === "string") {
    style.color = styleJson.color;
  }
  if ("borderColor" in styleJson && typeof styleJson.borderColor === "string") {
    style.borderColor = styleJson.borderColor;
  }
  if ("borderWidth" in styleJson && typeof styleJson.borderWidth === "number") {
    style.borderWidth = styleJson.borderWidth;
  }
  if ("borderRadius" in styleJson && typeof styleJson.borderRadius === "number") {
    style.borderRadius = styleJson.borderRadius;
  }
  if ("border" in styleJson && typeof styleJson.border === "string") {
    style.border = styleJson.border;
  }
  if ("opacity" in styleJson && typeof styleJson.opacity === "number") {
    style.opacity = styleJson.opacity;
  }
  if ("imageZoom" in styleJson && typeof styleJson.imageZoom === "number" && Number.isFinite(styleJson.imageZoom)) {
    style.imageZoom = Math.min(Math.max(styleJson.imageZoom, 1), 3);
  }
  if ("objectPositionX" in styleJson && typeof styleJson.objectPositionX === "number" && Number.isFinite(styleJson.objectPositionX)) {
    style.objectPositionX = Math.min(Math.max(styleJson.objectPositionX, 0), 100);
  }
  if ("objectPositionY" in styleJson && typeof styleJson.objectPositionY === "number" && Number.isFinite(styleJson.objectPositionY)) {
    style.objectPositionY = Math.min(Math.max(styleJson.objectPositionY, 0), 100);
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

function resolveImageAsset(dbField: DbIdTemplateField, assetsById: Map<string, DbIdTemplateAsset>) {
  if (dbField.type !== "IMAGE" || !dbField.assetId) return null;

  const asset = dbField.asset ?? assetsById.get(dbField.assetId) ?? null;
  if (!asset) return null;
  if (asset.id !== dbField.assetId) return null;
  if (asset.templateId !== dbField.templateId) return null;
  if (asset.kind !== "IMAGE") return null;
  if (asset.side !== dbField.side) return null;
  if (!asset.objectPath || asset.publicUrl) return null;

  return asset;
}

/**
 * Convert a DB field to the code renderer field format
 */
function convertDbFieldToRenderer(dbField: DbIdTemplateField, assetsById: Map<string, DbIdTemplateAsset>): IdTemplateField {
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

  const imageAsset = resolveImageAsset(dbField, assetsById);
  if (imageAsset) {
    field.assetId = imageAsset.id;
    field.imageUrl = buildIdTemplateAssetUrl(imageAsset.id);
  }

  if (dbField.staticValue) {
    field.value = dbField.staticValue;
  }

  if (dbField.fit) {
    if (dbField.fit === "cover" || dbField.fit === "contain" || dbField.fit === "fill") {
      field.fit = dbField.fit;
    }
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
    const assetsById = new Map(dbTemplate.assets.map((asset) => [asset.id, asset]));
    const frontFields = dbTemplate.fields
      .filter((f) => mapDbSide(f.side) === "front")
      .map((f) => convertDbFieldToRenderer(f, assetsById));

    const backFields = dbTemplate.fields
      .filter((f) => mapDbSide(f.side) === "back")
      .map((f) => convertDbFieldToRenderer(f, assetsById));

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
