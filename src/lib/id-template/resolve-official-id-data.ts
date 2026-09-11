export type OfficialIdTemplateInput = {
  fullName: string;
  position: string;
  barangay: string;
  municipality: string;
  idNumber: string;
  qrValue: string;
  photoUrl: string;
  sitio?: string | null;
  skfedPosition?: string | null;
  dateElected?: string | null;
  termEnd?: string | null;
  termPeriod?: string;
  birthDate?: string | null;
  contactNo?: string | null;
  email?: string | null;
  address?: string | null;
  admissionStatus?: string | null;
  registryStatus: string;
  accountStatus?: string | null;
  sktechLogoUrl: string;
  skfedLogoUrl: string;
  provincialSealUrl: string;
  provinceName: string;
  contactInfo: string;
  issuedDate?: string;
  websiteUrl: string;
  watermark: string;
};

export type OfficialIdTemplateData = Record<string, string>;

const EMPTY_TEXT = "";
const NOT_RECORDED = "Not recorded";

const safeText = (value: string | null | undefined, fallback = EMPTY_TEXT) => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null" || text === "NaN") return fallback;
  return text;
};

const formatDisplayDate = (value: string | null | undefined) => {
  const text = safeText(value);
  if (!text) return NOT_RECORDED;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  })
    .format(parsed)
    .toUpperCase();
};

const yearLabel = (value: string | null | undefined) => {
  const text = safeText(value);
  if (!text) return EMPTY_TEXT;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return EMPTY_TEXT;

  return String(parsed.getFullYear());
};

export function resolveOfficialIdTemplateData(
  input: OfficialIdTemplateInput,
): OfficialIdTemplateData {
  const province = safeText(input.provinceName, "ORIENTAL MINDORO");
  const documentId = input.idNumber.startsWith("SKTE-")
    ? input.idNumber
    : `SKTE-ORM-${input.idNumber}`;
  const displayPosition = input.skfedPosition
    ? `${safeText(input.position, NOT_RECORDED)} / ${safeText(input.skfedPosition)}`
    : safeText(input.position, NOT_RECORDED);
  const address =
    safeText(input.address) ||
    [input.sitio ? `Sitio ${safeText(input.sitio)}` : "", input.barangay, input.municipality, province]
      .map((part) => safeText(part))
      .filter(Boolean)
      .join(", ");
  const electedYear = yearLabel(input.dateElected);
  const termEndYear = yearLabel(input.termEnd);
  const serviceTerm =
    safeText(input.termPeriod) || [electedYear, termEndYear].filter(Boolean).join("-") || NOT_RECORDED;
  const verified = input.admissionStatus
    ? input.admissionStatus === "APPROVED"
    : input.registryStatus === "ACTIVE";
  const statusLabel = verified ? "Verified" : "Pending";
  const issued = safeText(input.issuedDate, "Upon registry approval");

  return {
    officialId: documentId,
    idNumber: safeText(input.idNumber),
    documentId,
    fullName: safeText(input.fullName, NOT_RECORDED),
    position: safeText(input.position, NOT_RECORDED),
    skfedPosition: safeText(input.skfedPosition, NOT_RECORDED),
    displayPosition,
    barangay: safeText(input.barangay, NOT_RECORDED),
    municipality: safeText(input.municipality, NOT_RECORDED),
    province,
    provinceFederation: `${province} SK Federation`,
    address: safeText(address, NOT_RECORDED),
    birthDate: formatDisplayDate(input.birthDate),
    dateElected: formatDisplayDate(input.dateElected),
    termEnd: formatDisplayDate(input.termEnd),
    serviceTerm,
    contactNo: safeText(input.contactNo, NOT_RECORDED),
    email: safeText(input.email, NOT_RECORDED),
    admissionStatus: safeText(input.admissionStatus, NOT_RECORDED),
    registryStatus: safeText(input.registryStatus, NOT_RECORDED),
    accountStatus: safeText(input.accountStatus || input.registryStatus, NOT_RECORDED),
    photoUrl: safeText(input.photoUrl, "/images/default-official.svg"),
    qrValue: safeText(input.qrValue, "/"),
    sktechLogoUrl: safeText(input.sktechLogoUrl),
    skfedLogoUrl: safeText(input.skfedLogoUrl),
    provincialSealUrl: safeText(input.provincialSealUrl),
    contactInfo: safeText(input.contactInfo),
    websiteUrl: safeText(input.websiteUrl),
    watermark: safeText(input.watermark),
    issuedLabel: `Issued: ${issued}`,
    statusLabel,
    municipalityStatus: `${safeText(input.municipality, NOT_RECORDED)} - ${statusLabel}`,
  };
}
