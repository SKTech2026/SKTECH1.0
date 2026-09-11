/**
 * Validate an ID template and return a safe fallback if invalid.
 *
 * This helper ensures that only templates with valid structure,
 * dimensions, and approved source keys are used for rendering.
 */

import { DEFAULT_ID_TEMPLATE } from "@/components/id-template/default-template";
import type { IdTemplate, IdTemplateField } from "@/components/id-template/default-template";

/**
 * Allowlist of safe source keys that can be rendered.
 * These are all public display fields that appear on the ID card.
 */
const VALID_SOURCE_KEYS = new Set([
  // Front side
  "provincialSealUrl",
  "province",
  "skfedLogoUrl",
  "photoUrl",
  "fullName",
  "birthDate",
  "displayPosition",
  "address",
  "documentId",
  "serviceTerm",
  "sktechLogoUrl",
  "municipalityStatus",
  "watermark",

  // Back side
  "qrValue",
  "provinceFederation",
  "dateElected",
  "contactNo",
  "email",
  "contactInfo",
  "websiteUrl",
  "issuedLabel",
]);

/**
 * Validate canvas dimensions
 */
function isValidCanvasDimension(value: unknown): boolean {
  if (typeof value !== "number") return false;
  if (!isFinite(value)) return false;
  if (value <= 0) return false;
  if (value > 5000) return false;
  return true;
}

/**
 * Validate field coordinates and dimensions
 */
function isValidFieldDimensions(field: IdTemplateField): boolean {
  if (!isFinite(field.xPercent) || field.xPercent < 0 || field.xPercent > 100) return false;
  if (!isFinite(field.yPercent) || field.yPercent < 0 || field.yPercent > 100) return false;
  if (!isFinite(field.widthPercent) || field.widthPercent <= 0 || field.widthPercent > 100) return false;
  if (!isFinite(field.heightPercent) || field.heightPercent <= 0 || field.heightPercent > 100) return false;
  return true;
}

/**
 * Check if a source key is in the allowlist
 */
function isAllowedSourceKey(key: string | undefined): boolean {
  if (!key) return true; // No sourceKey is fine (e.g., staticText, shape)
  return VALID_SOURCE_KEYS.has(key);
}

/**
 * Validate and sanitize a field
 */
function validateField(field: IdTemplateField): IdTemplateField | null {
  // Check required fields
  if (!field.id || !field.type) {
    console.warn("Field missing required properties");
    return null;
  }

  // Check dimensions
  if (!isValidFieldDimensions(field)) {
    console.warn(`Field ${field.id} has invalid dimensions`);
    return null;
  }

  // Validate sourceKey if present
  if (field.sourceKey && !isAllowedSourceKey(field.sourceKey)) {
    console.warn(`Field ${field.id} has disallowed sourceKey: ${field.sourceKey}`);
    // Remove the sourceKey to prevent rendering from accessing non-whitelisted data
    const sanitized = { ...field };
    delete sanitized.sourceKey;
    return sanitized;
  }

  return field;
}

/**
 * Validate that template has required structure
 */
function validateTemplateStructure(template: IdTemplate): boolean {
  if (!template) return false;
  if (typeof template !== "object") return false;
  if (!template.canvas) return false;
  if (!template.sides) return false;
  if (!template.sides.front || !template.sides.back) return false;
  if (!Array.isArray(template.sides.front.fields) || !Array.isArray(template.sides.back.fields)) return false;

  return true;
}

/**
 * Check if a QR field exists in the template
 */
function hasQrField(template: IdTemplate): boolean {
  const allFields = [...(template.sides.front.fields || []), ...(template.sides.back.fields || [])];
  return allFields.some((f) => f.type === "qr");
}

/**
 * Validate a template and return it if valid, or DEFAULT_ID_TEMPLATE if invalid.
 *
 * Safety:
 * - Returns DEFAULT_ID_TEMPLATE if any validation fails
 * - Sanitizes fields with invalid sourceKeys
 * - Checks canvas dimensions
 * - Verifies field structure
 * - Ensures QR field exists (warning only, doesn't fail)
 * - No DB writes
 * - No side effects
 */
export function validateIdTemplateOrDefault(template: IdTemplate | null): IdTemplate {
  // Null template uses default
  if (!template) {
    console.warn("Template is null, using DEFAULT_ID_TEMPLATE");
    return DEFAULT_ID_TEMPLATE;
  }

  // Validate structure
  if (!validateTemplateStructure(template)) {
    console.warn("Template structure is invalid, using DEFAULT_ID_TEMPLATE");
    return DEFAULT_ID_TEMPLATE;
  }

  // Validate canvas dimensions
  if (!isValidCanvasDimension(template.canvas.width) || !isValidCanvasDimension(template.canvas.height)) {
    console.warn("Template canvas dimensions are invalid, using DEFAULT_ID_TEMPLATE");
    return DEFAULT_ID_TEMPLATE;
  }

  // Validate fields exist
  const frontFields = template.sides.front.fields || [];
  const backFields = template.sides.back.fields || [];
  const allFields = [...frontFields, ...backFields];

  if (allFields.length === 0) {
    console.warn("Template has no fields, using DEFAULT_ID_TEMPLATE");
    return DEFAULT_ID_TEMPLATE;
  }

  // Validate individual fields
  const validatedFrontFields: IdTemplateField[] = [];
  for (const field of frontFields) {
    const validated = validateField(field);
    if (validated) {
      validatedFrontFields.push(validated);
    } else {
      console.warn(`Skipping invalid front field: ${field.id}`);
    }
  }

  const validatedBackFields: IdTemplateField[] = [];
  for (const field of backFields) {
    const validated = validateField(field);
    if (validated) {
      validatedBackFields.push(validated);
    } else {
      console.warn(`Skipping invalid back field: ${field.id}`);
    }
  }

  // If too many fields were invalid, fall back
  const validationLoss = allFields.length - validatedFrontFields.length - validatedBackFields.length;
  if (validationLoss > allFields.length * 0.5) {
    // More than 50% of fields failed validation
    console.warn(
      `Template lost ${validationLoss} fields during validation (>${50}%), using DEFAULT_ID_TEMPLATE`,
    );
    return DEFAULT_ID_TEMPLATE;
  }

  // Warn if QR field is missing (but don't fail)
  if (!hasQrField(template)) {
    console.warn("Template is missing QR field, rendering may be incomplete");
  }

  // Return the validated template with sanitized fields
  const validated: IdTemplate = {
    version: template.version,
    canvas: template.canvas,
    sides: {
      front: { fields: validatedFrontFields },
      back: { fields: validatedBackFields },
    },
  };

  return validated;
}
