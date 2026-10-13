import { OfficialPosition, SKFederationLevel, SKFederationPosition } from "@prisma/client";

export const BARANGAY_POSITION_OPTIONS = Object.values(OfficialPosition);
export const FEDERATION_LEVEL_OPTIONS = [SKFederationLevel.MUNICIPAL, SKFederationLevel.PROVINCIAL] as const;
export const MUNICIPAL_FEDERATION_POSITION_OPTIONS = Object.values(SKFederationPosition);
export const PROVINCIAL_FEDERATION_POSITION_OPTIONS = Object.values(SKFederationPosition);
export const SKFED_POSITION_OPTIONS = MUNICIPAL_FEDERATION_POSITION_OPTIONS;

export const OFFICIAL_TYPE_OPTIONS = [
  { value: "BARANGAY", label: "Barangay SK Official" },
  { value: SKFederationLevel.MUNICIPAL, label: "SK Municipal Federation Officer" },
  { value: SKFederationLevel.PROVINCIAL, label: "SK Provincial Federation Officer" },
] as const;

export function federationLevelLabel(level: SKFederationLevel | null | undefined, isOfficer = false) {
  if (!isOfficer) return "Barangay SK Official";
  return level === SKFederationLevel.PROVINCIAL ? "SK Provincial Federation Officer" : "SK Municipal Federation Officer";
}

export function federationPositions(level: SKFederationLevel | null | undefined) {
  return level === SKFederationLevel.PROVINCIAL ? PROVINCIAL_FEDERATION_POSITION_OPTIONS : MUNICIPAL_FEDERATION_POSITION_OPTIONS;
}
