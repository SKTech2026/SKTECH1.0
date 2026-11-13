import "server-only";

import { Prisma } from "@prisma/client";

import { convertDbTemplateToRendererTemplate } from "@/lib/id-template/db-to-renderer-converter";
import { DbIdTemplate, DbIdTemplateAsset } from "@/lib/id-template/load-active-id-template";
import { validateIdTemplateOrDefault, isAllowedTemplateSourceKey } from "@/lib/id-template/validate-template";
import { validateFieldDimensionPercent } from "@/lib/id-template/field-dimensions";
import {
  downloadIdTemplateImageAsset,
  isIdTemplateAssetObjectPath,
  resolveIdTemplateAssetMimeType,
} from "@/lib/id-template/id-template-asset-storage";
import { hasFileSignature } from "@/lib/file-signatures";

const ACTIVATION_LOCK_ID = 8_431_579_204;
const TEMPLATE_TYPES = new Set(["STATIC_TEXT", "TEXT", "IMAGE", "QR", "SHAPE"]);
const IMAGE_SOURCE_KEYS = new Set(["photoUrl", "provincialSealUrl", "skfedLogoUrl", "sktechLogoUrl"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TEXT_STYLE_KEYS = new Set(["fontSize", "fontWeight", "color", "align", "lineHeight", "letterSpacing", "textTransform", "fontStyle", "opacity"]);
const SHAPE_STYLE_KEYS = new Set(["background", "backgroundColor", "fill", "color", "border", "borderColor", "borderWidth", "borderRadius", "opacity"]);
const IMAGE_STYLE_KEYS = new Set(["imageZoom", "objectPositionX", "objectPositionY"]);
const QR_STYLE_KEYS = new Set(["background", "border", "borderRadius"]);
const TEXT_SOURCE_KEYS = new Set([
  "officialId", "idNumber", "documentId", "fullName", "position", "skfedPosition", "displayPosition",
  "barangay", "municipality", "province", "provinceFederation", "dateElected", "termEnd", "serviceTerm",
  "admissionStatus", "registryStatus", "accountStatus", "contactInfo", "websiteUrl", "watermark",
  "issuedLabel", "statusLabel", "municipalityStatus", "birthDate", "address", "contactNo", "email",
]);
const BASIC_COLORS = new Set(["black", "white", "red", "green", "blue", "yellow", "gray", "grey", "transparent"]);

export class TemplateActivationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "TemplateActivationError";
  }
}

export type TemplateActivationTransaction = Pick<Prisma.TransactionClient, "idTemplate" | "$queryRaw">;

export type VerifyTemplateAsset = (asset: DbIdTemplateAsset) => Promise<void>;

function safeColor(value: unknown) {
  if (typeof value !== "string") return false;
  const color = value.trim();
  return BASIC_COLORS.has(color.toLowerCase()) ||
    /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(color) ||
    /^rgba?\(\s*(\d{1,3}\s*,\s*){2}\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(color) ||
    /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(color);
}

function validStyleJson(type: string, value: Record<string, unknown> | null) {
  if (!value) return true;
  const keys = type === "SHAPE" ? SHAPE_STYLE_KEYS : type === "IMAGE" ? IMAGE_STYLE_KEYS :
    type === "QR" ? QR_STYLE_KEYS : TEXT_STYLE_KEYS;
  for (const [key, style] of Object.entries(value)) {
    if (!keys.has(key)) return false;
    if (type === "STATIC_TEXT" || type === "TEXT") {
      if (key === "fontSize" && (typeof style !== "number" || !Number.isFinite(style) || style < 1 || style > 200)) return false;
      if (key === "fontWeight" && !(["normal", "bold", "lighter", "bolder", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(String(style)) ||
          (typeof style === "number" && Number.isInteger(style) && style >= 100 && style <= 900 && style % 100 === 0))) return false;
      if (key === "color" && !safeColor(style)) return false;
      if (key === "align" && !["left", "center", "right"].includes(String(style))) return false;
      if (key === "lineHeight" && (typeof style !== "number" || !Number.isFinite(style) || style < 0.5 || style > 4)) return false;
      if (key === "letterSpacing") {
        const match = typeof style === "string" ? style.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/) : null;
        if (!match || Number(match[1]) < -20 || Number(match[1]) > 50) return false;
      }
      if (key === "textTransform" && !["none", "uppercase", "lowercase", "capitalize"].includes(String(style))) return false;
      if (key === "fontStyle" && !["normal", "italic"].includes(String(style))) return false;
      if (key === "opacity" && (typeof style !== "number" || !Number.isFinite(style) || style < 0 || style > 1)) return false;
    } else if (type === "SHAPE") {
      if (["background", "backgroundColor", "fill", "color", "borderColor"].includes(key) && !safeColor(style)) return false;
      if (key === "border" && (typeof style !== "string" || !/^\d+(?:\.\d+)?px\s+solid\s+#[0-9a-fA-F]{3,6}$/.test(style.trim()))) return false;
      if (["borderWidth", "borderRadius"].includes(key) && (typeof style !== "number" || !Number.isFinite(style) || style < 0 || style > (key === "borderWidth" ? 20 : 100))) return false;
      if (key === "opacity" && (typeof style !== "number" || !Number.isFinite(style) || style < 0 || style > 1)) return false;
    } else if (type === "IMAGE") {
      if (typeof style !== "number" || !Number.isFinite(style) ||
          (key === "imageZoom" ? style < 1 || style > 3 : style < 0 || style > 100)) return false;
    } else if (type === "QR") {
      if (key === "background" && !safeColor(style)) return false;
      if (key === "border" && (typeof style !== "string" || !/^\d+(?:\.\d+)?px\s+solid\s+#[0-9a-fA-F]{3,6}$/.test(style.trim()))) return false;
      if (key === "borderRadius" && (typeof style !== "number" || !Number.isFinite(style) || style < 0 || style > 100)) return false;
    }
  }
  return true;
}

async function verifyImageBytes(asset: DbIdTemplateAsset) {
  if (!asset.objectPath || !isIdTemplateAssetObjectPath(asset.objectPath)) {
    throw new TemplateActivationError(`Image asset "${asset.id}" has an invalid Railway object path.`, 422);
  }
  if (asset.publicUrl) {
    throw new TemplateActivationError(`Image asset "${asset.id}" uses an unsupported public URL.`, 422);
  }
  const mimeType = resolveIdTemplateAssetMimeType(asset.mimeType, asset.objectPath);
  if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new TemplateActivationError(`Image asset "${asset.id}" has an unsupported MIME type.`, 422);
  }

  let image: Blob;
  try {
    image = await downloadIdTemplateImageAsset(asset.objectPath);
  } catch {
    throw new TemplateActivationError(`Image asset "${asset.id}" is unavailable in Railway storage.`, 422);
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  if (!bytes.length || !hasFileSignature(bytes, mimeType)) {
    throw new TemplateActivationError(`Image asset "${asset.id}" does not match its stored image type.`, 422);
  }
  if (bytes.length > 2 * 1024 * 1024) {
    throw new TemplateActivationError(`Image asset "${asset.id}" exceeds the supported size limit.`, 422);
  }
}

export async function validateSavedTemplateForActivation(
  template: DbIdTemplate,
  verifyAsset: VerifyTemplateAsset = verifyImageBytes,
) {
  if (!template.fields.length) {
    throw new TemplateActivationError("The template has no saved fields.", 422);
  }
  if (!Number.isFinite(template.canvasWidth) || template.canvasWidth <= 0 || template.canvasWidth > 5000 ||
      !Number.isFinite(template.canvasHeight) || template.canvasHeight <= 0 || template.canvasHeight > 5000) {
    throw new TemplateActivationError("The template canvas dimensions are invalid.", 422);
  }

  const ids = new Set<string>();
  const assetsById = new Map(template.assets.map((asset) => [asset.id, asset]));
  const referencedAssets = new Map<string, DbIdTemplateAsset>();
  const sideCounts = { FRONT: 0, BACK: 0 };
  let qrCount = 0;

  for (const field of template.fields) {
    if (!field.id || ids.has(field.id)) {
      throw new TemplateActivationError(`The template contains a missing or duplicate field ID "${field.id}".`, 422);
    }
    ids.add(field.id);
    if (field.side !== "FRONT" && field.side !== "BACK") {
      throw new TemplateActivationError(`Field "${field.id}" has an invalid side.`, 422);
    }
    sideCounts[field.side]++;
    if (!TEMPLATE_TYPES.has(field.type)) {
      throw new TemplateActivationError(`Field "${field.id}" has an unsupported type.`, 422);
    }
    if (!Number.isFinite(field.xPercent) || field.xPercent < 0 || field.xPercent > 100 ||
        !Number.isFinite(field.yPercent) || field.yPercent < 0 || field.yPercent > 100) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has invalid position coordinates.`, 422);
    }
    try {
      validateFieldDimensionPercent(field.widthPercent, field.id, field.side, "widthPercent");
      validateFieldDimensionPercent(field.heightPercent, field.id, field.side, "heightPercent");
    } catch (error) {
      throw new TemplateActivationError(error instanceof Error ? error.message : `Field "${field.id}" has invalid dimensions.`, 422);
    }
    if (!Number.isInteger(field.zIndex) || field.zIndex < -1000 || field.zIndex > 1000) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has an invalid z-index.`, 422);
    }
    if (field.fit !== null && field.fit !== "cover" && field.fit !== "contain" && field.fit !== "fill") {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has an unsupported image fit mode.`, 422);
    }
    if (field.radius !== null && (!Number.isFinite(field.radius) || field.radius < 0 || field.radius > 100)) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has an invalid radius.`, 422);
    }
    if (typeof field.visible !== "boolean") {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has invalid visibility data.`, 422);
    }
    if (field.sourceKey && !isAllowedTemplateSourceKey(field.sourceKey)) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has an unsupported dynamic binding.`, 422);
    }
    if (field.styleJson !== null && (typeof field.styleJson !== "object" || Array.isArray(field.styleJson))) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has invalid style data.`, 422);
    }
    if (!validStyleJson(field.type, field.styleJson)) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} field "${field.id}" has an unsupported or invalid style property.`, 422);
    }

    if (field.type === "STATIC_TEXT" && (field.staticValue === null || field.sourceKey !== null)) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} text field "${field.id}" has no saved text.`, 422);
    }
    if (field.type === "TEXT" && !field.sourceKey && field.staticValue === null) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} text field "${field.id}" has no text or dynamic binding.`, 422);
    }
    if (field.type === "TEXT" && field.sourceKey && !TEXT_SOURCE_KEYS.has(field.sourceKey)) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} text field "${field.id}" uses a non-text dynamic binding.`, 422);
    }
    if (field.type === "QR") {
      qrCount++;
      if (!field.visible || field.sourceKey !== "qrValue" || field.assetId) {
        throw new TemplateActivationError(`${field.side.toLowerCase()} QR field "${field.id}" must use the SKTECH verification binding.`, 422);
      }
    }
    if (field.type === "IMAGE") {
      if (field.assetId) {
        if (field.sourceKey) {
          throw new TemplateActivationError(`${field.side.toLowerCase()} image field "${field.id}" cannot mix an uploaded asset with a dynamic image binding.`, 422);
        }
        const asset = assetsById.get(field.assetId);
        if (!asset || asset.id !== field.assetId || asset.templateId !== template.id ||
            asset.kind !== "IMAGE" || asset.side !== field.side) {
          throw new TemplateActivationError(`${field.side.toLowerCase()} image field "${field.id}" references an invalid template asset.`, 422);
        }
        referencedAssets.set(asset.id, asset);
      } else if (!field.sourceKey || !IMAGE_SOURCE_KEYS.has(field.sourceKey)) {
        throw new TemplateActivationError(`${field.side.toLowerCase()} image field "${field.id}" has no supported image source.`, 422);
      }
    } else if (field.assetId) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} non-image field "${field.id}" references an image asset.`, 422);
    } else if (field.type === "STATIC_TEXT" && field.sourceKey) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} static text field "${field.id}" cannot use a dynamic binding.`, 422);
    } else if (field.type === "SHAPE" && field.sourceKey) {
      throw new TemplateActivationError(`${field.side.toLowerCase()} shape field "${field.id}" cannot use a dynamic text binding.`, 422);
    }
  }

  if (!sideCounts.FRONT || !sideCounts.BACK) {
    throw new TemplateActivationError("Both front and back sides must contain saved fields.", 422);
  }
  if (!qrCount) {
    throw new TemplateActivationError("The template must include a QR code linked to SKTECH verification.", 422);
  }

  for (const asset of referencedAssets.values()) await verifyAsset(asset);

  const converted = convertDbTemplateToRendererTemplate(template);
  if (!converted) {
    throw new TemplateActivationError("The saved template cannot be converted for production rendering.", 422);
  }
  const validated = validateIdTemplateOrDefault(converted);
  const validatedIds = new Set([
    ...validated.sides.front.fields.map((field) => field.id),
    ...validated.sides.back.fields.map((field) => field.id),
  ]);
  if (validatedIds.size !== template.fields.length || template.fields.some((field) => !validatedIds.has(field.id))) {
    throw new TemplateActivationError("Template validation would omit one or more saved fields; no changes were made.", 422);
  }
  if (JSON.stringify(validated) !== JSON.stringify(converted)) {
    throw new TemplateActivationError("Template validation would change one or more saved renderer properties; no changes were made.", 422);
  }

  return { frontFields: sideCounts.FRONT, backFields: sideCounts.BACK, assetsVerified: referencedAssets.size };
}

function assertExpectedUpdatedAt(value: string, actual: Date) {
  const expected = new Date(value);
  if (!Number.isFinite(expected.getTime()) || expected.getTime() !== actual.getTime()) {
    throw new TemplateActivationError("The saved template changed after it was loaded. Reload it before activating.", 409);
  }
}

async function acquireActivationLock(tx: TemplateActivationTransaction) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(${BigInt(ACTIVATION_LOCK_ID)})`;
}

export async function activateSavedTemplate(
  tx: TemplateActivationTransaction,
  input: { templateId: string; expectedUpdatedAt: string; adminUserId: string },
  verifyAsset: VerifyTemplateAsset = verifyImageBytes,
) {
  await acquireActivationLock(tx);

  const template = await tx.idTemplate.findUnique({
    where: { id: input.templateId },
    include: {
      fields: { include: { asset: true }, orderBy: [{ side: "asc" }, { zIndex: "asc" }, { createdAt: "asc" }] },
      assets: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!template) throw new TemplateActivationError("Saved template not found.", 404);

  if (template.isActive && template.status === "ACTIVE") {
    return { alreadyActive: true, activated: { id: template.id, name: template.name }, previousActive: [] };
  }
  if (template.isActive || template.status !== "DRAFT") {
    throw new TemplateActivationError("Only an inactive saved draft can be activated.", 409);
  }
  assertExpectedUpdatedAt(input.expectedUpdatedAt, template.updatedAt);

  const validation = await validateSavedTemplateForActivation(template as DbIdTemplate, verifyAsset);
  const previousActive = await tx.idTemplate.findMany({
    where: { isActive: true, status: "ACTIVE" },
    select: { id: true, name: true, updatedAt: true },
  });
  for (const previous of previousActive) {
    await tx.idTemplate.update({
      where: { id: previous.id },
      data: { isActive: false, status: "DRAFT", updatedAt: previous.updatedAt },
    });
  }

  const activated = await tx.idTemplate.update({
    where: { id: template.id },
    data: {
      isActive: true,
      status: "ACTIVE",
      updatedById: input.adminUserId,
      updatedAt: new Date(),
    },
    select: { id: true, name: true, status: true, isActive: true },
  });

  return {
    alreadyActive: false,
    activated,
    previousActive: previousActive.map(({ id, name }) => ({ id, name })),
    validation,
  };
}

export async function deactivateToCodeDefault(
  tx: TemplateActivationTransaction,
  input: { expectedActiveTemplateId: string; expectedUpdatedAt: string },
) {
  await acquireActivationLock(tx);
  const activeTemplates = await tx.idTemplate.findMany({
    where: { isActive: true, status: "ACTIVE" },
    select: { id: true, name: true, status: true, isActive: true, updatedAt: true },
  });
  const active = activeTemplates.find((template) => template.id === input.expectedActiveTemplateId);
  if (!active || !active.isActive || active.status !== "ACTIVE") {
    throw new TemplateActivationError("The active template changed. Reload before returning to the built-in default.", 409);
  }
  assertExpectedUpdatedAt(input.expectedUpdatedAt, active.updatedAt);
  for (const template of activeTemplates) {
    await tx.idTemplate.update({
      where: { id: template.id },
      data: { isActive: false, status: "DRAFT", updatedAt: template.updatedAt },
    });
  }
  return {
    deactivated: activeTemplates.map(({ id, name }) => ({ id, name })),
    productionUses: "CODE_DEFAULT" as const,
  };
}
