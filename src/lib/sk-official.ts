import { OfficialPosition, OfficialRole } from "@prisma/client";

export type SKOfficialFormPayload = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  birthDate: string;
  province: string;
  municipalityId: string;
  barangayId: string;
  position: OfficialPosition;
  dateElected: string;
  termEnd: string;
  email: string;
  contactNo: string | null;
  address: string | null;
};

export type AdmissionProofUploadPayload = {
  fileName: string;
  mimeType: string;
  dataUrl: string;
};

export type AdmissionFaceCapturePayload = {
  imageBase64: string;
  livenessFrames: string[];
};

export type SKOfficialAdmissionSubmissionPayload = SKOfficialFormPayload & {
  proofUpload: AdmissionProofUploadPayload;
  faceCapture: AdmissionFaceCapturePayload;
};

export type MunicipalityOption = {
  id: string;
  name: string;
  province: string;
  barangays: {
    id: string;
    name: string;
  }[];
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const OFFICIAL_POSITION_OPTIONS = Object.values(OfficialPosition);

export function toTermEndDate(dateElected: string): string {
  if (!dateElected) {
    return "";
  }

  const selected = new Date(`${dateElected}T00:00:00`);
  if (Number.isNaN(selected.getTime())) {
    return "";
  }

  selected.setFullYear(selected.getFullYear() + 1);
  return selected.toISOString().slice(0, 10);
}

export function positionToLegacyRole(position: OfficialPosition): OfficialRole {
  if (position === "SK_CHAIRPERSON") return OfficialRole.CHAIRPERSON;
  if (position === "SK_SECRETARY") return OfficialRole.SECRETARY;
  if (position === "SK_TREASURER") return OfficialRole.TREASURER;
  return OfficialRole.KAGAWAD;
}

function isValidDate(value: string): boolean {
  if (!value) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function validateSKOfficialPayload(
  payload: SKOfficialFormPayload,
  options?: { requireEmail?: boolean },
): string | null {
  if (!payload.firstName.trim()) return "First name is required.";
  if (!payload.lastName.trim()) return "Last name is required.";
  if (!isValidDate(payload.birthDate)) return "Birth date is required.";
  if (!payload.province.trim()) return "Province is required.";
  if (!payload.municipalityId.trim()) return "Municipality is required.";
  if (!payload.barangayId.trim()) return "Barangay is required.";
  if (!OFFICIAL_POSITION_OPTIONS.includes(payload.position)) return "Invalid position.";
  if (!isValidDate(payload.dateElected)) return "Date elected is required.";
  if (!isValidDate(payload.termEnd)) return "Term end date is invalid.";

  if (options?.requireEmail && !payload.email.trim()) {
    return "Email is required.";
  }

  if (payload.email.trim() && !EMAIL_REGEX.test(payload.email.trim().toLowerCase())) {
    return "A valid email is required.";
  }

  return null;
}
