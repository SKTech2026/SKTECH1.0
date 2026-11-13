import type { IdTemplate, IdTemplateField } from "@/components/id-template/default-template";

const BLUE = "#0B3A70";
const BLUE_DARK = "#082B53";
const BLUE_MID = "#14599B";
const BLUE_PALE = "#EAF2FA";
const RED = "#B32635";
const INK = "#12263A";
const MUTED = "#5C6E80";
const WHITE = "#FFFFFF";

function shape(
  id: string,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number,
  background: string,
  zIndex = 0,
  border?: string,
): IdTemplateField {
  return {
    id,
    type: "shape",
    xPercent,
    yPercent,
    widthPercent,
    heightPercent,
    zIndex,
    style: { background, ...(border ? { border } : {}) },
  };
}

function text(
  id: string,
  sourceKey: string,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number,
  style: NonNullable<IdTemplateField["style"]>,
  zIndex = 3,
): IdTemplateField {
  return { id, type: "text", sourceKey, xPercent, yPercent, widthPercent, heightPercent, zIndex, style };
}

function label(
  id: string,
  value: string,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent = 3.2,
  zIndex = 3,
): IdTemplateField {
  return {
    id,
    type: "staticText",
    value,
    xPercent,
    yPercent,
    widthPercent,
    heightPercent,
    zIndex,
    style: { color: MUTED, fontSize: 7, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" },
  };
}

function image(
  id: string,
  sourceKey: string,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number,
  fit: "cover" | "contain" = "contain",
  zIndex = 3,
): IdTemplateField {
  return { id, type: "image", sourceKey, xPercent, yPercent, widthPercent, heightPercent, fit, zIndex };
}

const frontFields: IdTemplateField[] = [
  shape("front-paper", 0, 0, 100, 100, "#F7FAFD", 0),
  shape("front-header", 0, 0, 100, 21, BLUE, 1),
  shape("front-header-highlight", 0, 0, 1.1, 21, BLUE_MID, 2),
  shape("front-header-red-rule", 0, 20, 100, 1, RED, 2),
  image("front-sk-emblem", "skfedLogoUrl", 4.5, 3.2, 10.5, 14.2),
  image("front-provincial-seal", "provincialSealUrl", 85, 3.2, 10.5, 14.2),
  {
    id: "front-federation-title",
    type: "staticText",
    value: "SANGGUNIANG KABATAAN",
    xPercent: 17,
    yPercent: 5.2,
    widthPercent: 66,
    heightPercent: 5.2,
    zIndex: 3,
    style: { color: WHITE, fontSize: 17, fontWeight: 900, align: "center", letterSpacing: "0.06em" },
  },
  {
    id: "front-province-title",
    type: "staticText",
    value: "ORIENTAL MINDORO PROVINCIAL FEDERATION",
    xPercent: 17,
    yPercent: 12.3,
    widthPercent: 66,
    heightPercent: 3.5,
    zIndex: 3,
    style: { color: "#DCEBFA", fontSize: 8, fontWeight: 700, align: "center", letterSpacing: "0.08em" },
  },
  shape("front-portrait-frame", 4.5, 26.5, 23, 49, WHITE, 1, "1px solid #C9D9E8"),
  image("front-official-photo", "photoUrl", 5.5, 27.5, 21, 43.5, "cover", 2),
  {
    id: "front-photo-caption",
    type: "staticText",
    value: "OFFICIAL PHOTOGRAPH",
    xPercent: 5.5,
    yPercent: 72.5,
    widthPercent: 21,
    heightPercent: 3,
    zIndex: 3,
    style: { color: MUTED, fontSize: 6, fontWeight: 800, align: "center", letterSpacing: "0.04em" },
  },
  label("front-name-label", "OFFICIAL NAME", 32, 26.5, 62),
  text("front-official-name", "fullName", 32, 30, 63, 10, {
    color: INK, fontSize: 18, fontWeight: 900, lineHeight: 1.05, textTransform: "uppercase",
  }),
  text("front-official-position", "displayPosition", 32, 41.5, 63, 6, {
    color: BLUE_MID, fontSize: 11, fontWeight: 800, lineHeight: 1.1, textTransform: "uppercase",
  }),
  shape("front-info-divider", 32, 49.5, 63, 0.45, "#C9D9E8", 2),
  label("front-municipality-label", "MUNICIPALITY", 32, 52.5, 28),
  text("front-municipality", "municipality", 32, 56, 28, 5.5, {
    color: INK, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
  }),
  label("front-barangay-label", "BARANGAY", 64, 52.5, 31),
  text("front-barangay", "barangay", 64, 56, 31, 5.5, {
    color: INK, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
  }),
  shape("front-term-panel", 31, 65, 34, 13, BLUE_PALE, 1),
  label("front-term-label", "TERM OF SERVICE", 33, 66.5, 30, 2.8),
  text("front-term", "serviceTerm", 33, 70, 30, 5.5, {
    color: BLUE_DARK, fontSize: 11, fontWeight: 900, letterSpacing: "0.03em",
  }),
  shape("front-id-panel", 67, 65, 29, 13, WHITE, 1, "1px solid #C9D9E8"),
  label("front-id-label", "OFFICIAL ID NUMBER", 69, 66.5, 25, 2.8),
  text("front-id-number", "documentId", 69, 70, 25, 5.5, {
    color: BLUE_DARK, fontSize: 9, fontWeight: 900, letterSpacing: "0.02em",
  }),
  shape("front-footer-rule", 4.5, 83, 91, 0.4, "#C9D9E8", 1),
  image("front-sktech-wordmark", "sktechLogoUrl", 4.8, 86, 12, 8),
  {
    id: "front-footer-copy",
    type: "staticText",
    value: "YOUTH LEADERSHIP  /  ORIENTAL MINDORO",
    xPercent: 25,
    yPercent: 87.5,
    widthPercent: 70,
    heightPercent: 4,
    zIndex: 3,
    style: { color: MUTED, fontSize: 7, fontWeight: 800, align: "right", letterSpacing: "0.06em" },
  },
];

const backFields: IdTemplateField[] = [
  shape("back-paper", 0, 0, 100, 100, "#F7FAFD", 0),
  shape("back-header", 0, 0, 100, 22, BLUE, 1),
  shape("back-header-highlight", 0, 0, 1.1, 22, BLUE_MID, 2),
  shape("back-header-red-rule", 0, 21, 100, 1, RED, 2),
  {
    id: "back-title",
    type: "staticText",
    value: "IDENTITY & VERIFICATION",
    xPercent: 6,
    yPercent: 5,
    widthPercent: 70,
    heightPercent: 5,
    zIndex: 3,
    style: { color: WHITE, fontSize: 16, fontWeight: 900, letterSpacing: "0.05em" },
  },
  {
    id: "back-subtitle",
    type: "staticText",
    value: "SKTECH  /  ORIENTAL MINDORO",
    xPercent: 6,
    yPercent: 12,
    widthPercent: 68,
    heightPercent: 3.5,
    zIndex: 3,
    style: { color: "#DCEBFA", fontSize: 8, fontWeight: 700, letterSpacing: "0.08em" },
  },
  image("back-sktech-wordmark", "sktechLogoUrl", 85, 3.5, 10, 14),
  shape("back-qr-frame", 5, 27, 38, 57, WHITE, 1, "1px solid #C9D9E8"),
  shape("back-qr-accent", 5, 27, 38, 1.2, RED, 2),
  {
    id: "back-verification-qr",
    type: "qr",
    sourceKey: "qrValue",
    xPercent: 10,
    yPercent: 32,
    widthPercent: 28,
    heightPercent: 39,
    zIndex: 3,
    style: { background: WHITE, border: "2px solid #FFFFFF" },
  },
  {
    id: "back-scan-caption",
    type: "staticText",
    value: "SCAN TO VERIFY",
    xPercent: 8,
    yPercent: 74,
    widthPercent: 32,
    heightPercent: 4,
    zIndex: 3,
    style: { color: BLUE, fontSize: 8, fontWeight: 900, align: "center", letterSpacing: "0.08em" },
  },
  label("back-id-label", "OFFICIAL ID NUMBER", 50, 29, 44),
  text("back-id-number", "documentId", 50, 33, 44, 5.5, {
    color: INK, fontSize: 11, fontWeight: 900, letterSpacing: "0.02em",
  }),
  shape("back-id-divider", 50, 40, 44, 0.4, "#C9D9E8", 2),
  label("back-position-label", "OFFICIAL POSITION", 50, 43, 44),
  text("back-position", "displayPosition", 50, 47, 44, 6, {
    color: BLUE_MID, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
  }),
  label("back-location-label", "OFFICIAL LOCATION", 50, 56, 44),
  text("back-location", "address", 50, 60, 44, 6, {
    color: INK, fontSize: 9, fontWeight: 800, textTransform: "uppercase",
  }),
  {
    id: "back-verification-instructions",
    type: "staticText",
    value: "Scan the QR code to open the SKTECH public verification page. Confirm the displayed name and ID number.",
    xPercent: 50,
    yPercent: 68,
    widthPercent: 44,
    heightPercent: 10,
    zIndex: 3,
    style: { color: MUTED, fontSize: 8, fontWeight: 500, lineHeight: 1.2 },
  },
  label("back-signature-label", "AUTHORIZED SIGNATURE", 50, 82, 29, 3),
  shape("back-signature-line", 50, 87, 30, 0.4, BLUE_MID, 2),
  {
    id: "back-signature-note",
    type: "staticText",
    value: "Issuing SK office",
    xPercent: 50,
    yPercent: 88.5,
    widthPercent: 30,
    heightPercent: 3,
    zIndex: 3,
    style: { color: MUTED, fontSize: 6, fontWeight: 600 },
  },
  shape("back-footer-blue", 0, 95, 100, 5, BLUE_DARK, 1),
  shape("back-footer-red-rule", 0, 94.2, 100, 0.8, RED, 2),
  {
    id: "back-footer-copy",
    type: "staticText",
    value: "SKTECH  /  SANGGUNIANG KABATAAN  /  ORIENTAL MINDORO",
    xPercent: 5,
    yPercent: 96,
    widthPercent: 90,
    heightPercent: 3,
    zIndex: 3,
    style: { color: WHITE, fontSize: 6, fontWeight: 800, align: "center", letterSpacing: "0.04em" },
  },
];

export const SKTECH_PROVINCIAL_ID_TEMPLATE: IdTemplate = {
  version: 2,
  canvas: { width: 856, height: 539.8 },
  sides: {
    front: { fields: frontFields },
    back: { fields: backFields },
  },
};

export const SKTECH_PROVINCIAL_ID_TEMPLATE_NAME = "SKTECH Provincial Official ID - Modern Government v1";
export const SKTECH_PROVINCIAL_ID_TEMPLATE_ID = "sktech-provincial-id-modern-v1";
