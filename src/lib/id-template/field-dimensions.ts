export const MIN_FIELD_DIMENSION_PERCENT = 0.1;
export const MAX_FIELD_DIMENSION_PERCENT = 100;

export type FieldDimensionName = "widthPercent" | "heightPercent";

function formatValue(value: unknown) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "number") return Number.isNaN(value) ? "NaN" : String(value);
  if (typeof value === "string") return JSON.stringify(value.slice(0, 80));
  return Array.isArray(value) ? "[array]" : `[${typeof value}]`;
}

export function clampFieldDimensionPercent(value: number, fallback: number) {
  const safeFallback = Number.isFinite(fallback)
    ? Math.min(MAX_FIELD_DIMENSION_PERCENT, Math.max(MIN_FIELD_DIMENSION_PERCENT, fallback))
    : MIN_FIELD_DIMENSION_PERCENT;
  if (!Number.isFinite(value)) return safeFallback;
  return Math.min(MAX_FIELD_DIMENSION_PERCENT, Math.max(MIN_FIELD_DIMENSION_PERCENT, value));
}

export function validateFieldDimensionPercent(
  value: unknown,
  fieldId: string,
  side: string,
  dimension: FieldDimensionName,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < MIN_FIELD_DIMENSION_PERCENT ||
    value > MAX_FIELD_DIMENSION_PERCENT
  ) {
    throw new Error(
      `${side.toLowerCase()} field "${fieldId}" ${dimension} must be a finite number from ${MIN_FIELD_DIMENSION_PERCENT} to ${MAX_FIELD_DIMENSION_PERCENT}; received ${formatValue(value)}.`,
    );
  }
  return value;
}
