import type { IdTemplate } from "@/components/id-template/default-template";

const publicSourceKeys = new Set([
  "officialId", "idNumber", "documentId", "fullName", "position", "skfedPosition",
  "displayPosition", "barangay", "municipality", "province", "provinceFederation",
  "dateElected", "termEnd", "serviceTerm", "admissionStatus", "registryStatus",
  "accountStatus", "photoUrl", "qrValue", "sktechLogoUrl", "skfedLogoUrl",
  "provincialSealUrl", "contactInfo", "websiteUrl", "watermark", "issuedLabel",
  "statusLabel", "municipalityStatus",
]);

const privateLabel = /birth|date of birth|address|contact|phone|e-?mail|emergency|sitio/i;

export function publicOfficialIdTemplate(template: IdTemplate): IdTemplate {
  return {
    ...template,
    sides: {
      front: {
        ...template.sides.front,
        fields: template.sides.front.fields.filter((field) =>
          (!field.sourceKey || publicSourceKeys.has(field.sourceKey)) &&
          !privateLabel.test(`${field.id} ${field.type === "staticText" ? field.value ?? "" : ""}`)),
      },
      back: {
        ...template.sides.back,
        fields: template.sides.back.fields.filter((field) =>
          (!field.sourceKey || publicSourceKeys.has(field.sourceKey)) &&
          !privateLabel.test(`${field.id} ${field.type === "staticText" ? field.value ?? "" : ""}`)),
      },
    },
  };
}
