import dropdowns from "./oriental-mindoro-dropdowns.json";

export type OrientalMindoroLguType = "municipality" | "city";
export type OrientalMindoroLgu = {
  name: string;
  type: OrientalMindoroLguType;
  psgcCode: string;
  barangayCount: number;
  aliases?: readonly string[];
  barangays: readonly string[];
};
export type OrientalMindoroLocations = {
  metadata: {
    name: string;
    psgcCode: string;
    region: string;
    regionCode: string;
    source: string;
    psgcPublication: string;
    totalLGUs: number;
    totalMunicipalities: number;
    totalCities: number;
    totalBarangays: number;
  };
  lgus: OrientalMindoroLgu[];
};

// The attached user dataset is the sole source for dropdown names and counts.
// PSGC codes and the Calapan alias are existing repository identifiers.
const psgcCodes: Record<string, string> = {
  Baco: "1705201000", Bansud: "1705202000", Bongabong: "1705203000",
  Bulalacao: "1705204000", "City of Calapan": "1705205000",
  Gloria: "1705206000", Mansalay: "1705207000", Naujan: "1705208000",
  Pinamalayan: "1705209000", Pola: "1705210000", "Puerto Galera": "1705211000",
  Roxas: "1705212000", "San Teodoro": "1705213000", Socorro: "1705214000",
  Victoria: "1705215000",
};

export const ORIENTAL_MINDORO_LOCATIONS: OrientalMindoroLocations = {
  metadata: {
    name: dropdowns.province,
    psgcCode: "1705200000",
    region: dropdowns.region,
    regionCode: "1700000000",
    source: dropdowns.sourceNote,
    psgcPublication: "User-provided list; not PSA verified",
    totalLGUs: dropdowns.totalLGUs,
    totalMunicipalities: 14,
    totalCities: 1,
    totalBarangays: dropdowns.totalBarangays,
  },
  lgus: dropdowns.lgus.map((lgu) => ({
    ...lgu,
    type: lgu.type as OrientalMindoroLguType,
    psgcCode: psgcCodes[lgu.name],
    aliases: lgu.name === "City of Calapan" ? ["Calapan City"] : [],
  })),
};

export function normalizeLocationName(name: string) {
  return name.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
}

export function getOrientalMindoroMetadata() {
  return ORIENTAL_MINDORO_LOCATIONS.metadata;
}

export function getOrientalMindoroLgus(): readonly OrientalMindoroLgu[] {
  return ORIENTAL_MINDORO_LOCATIONS.lgus;
}

export function getOrientalMindoroBarangayCount() {
  return ORIENTAL_MINDORO_LOCATIONS.lgus.reduce(
    (total, lgu) => total + lgu.barangays.length,
    0,
  );
}

export function validateOrientalMindoroLocations() {
  const metadata = getOrientalMindoroMetadata();
  const lguCount = ORIENTAL_MINDORO_LOCATIONS.lgus.length;
  const municipalityCount = ORIENTAL_MINDORO_LOCATIONS.lgus.filter(
    (lgu) => lgu.type === "municipality",
  ).length;
  const cityCount = ORIENTAL_MINDORO_LOCATIONS.lgus.filter((lgu) => lgu.type === "city").length;
  const barangayCount = getOrientalMindoroBarangayCount();
  const lguBarangayMismatches = ORIENTAL_MINDORO_LOCATIONS.lgus
    .filter((lgu) => lgu.barangayCount !== lgu.barangays.length)
    .map((lgu) => ({
      name: lgu.name,
      expected: lgu.barangayCount,
      actual: lgu.barangays.length,
    }));
  const duplicateBarangays = ORIENTAL_MINDORO_LOCATIONS.lgus.flatMap((lgu) => {
    const seen = new Set<string>();
    return lgu.barangays
      .map((barangay) => normalizeLocationName(barangay))
      .filter((barangay) => {
        if (seen.has(barangay)) return true;
        seen.add(barangay);
        return false;
      })
      .map((barangay) => ({ lgu: lgu.name, barangay }));
  });
  const lguNames = ORIENTAL_MINDORO_LOCATIONS.lgus.map((lgu) => normalizeLocationName(lgu.name));
  const duplicateLgus = lguNames.filter((name, index) => lguNames.indexOf(name) !== index);
  const unknownLgus = ORIENTAL_MINDORO_LOCATIONS.lgus
    .filter((lgu) => !psgcCodes[lgu.name])
    .map((lgu) => lgu.name);
  const errors = [
    lguCount === metadata.totalLGUs ? null : `Expected ${metadata.totalLGUs} LGUs, got ${lguCount}.`,
    municipalityCount === metadata.totalMunicipalities
      ? null
      : `Expected ${metadata.totalMunicipalities} municipalities, got ${municipalityCount}.`,
    cityCount === metadata.totalCities ? null : `Expected ${metadata.totalCities} cities, got ${cityCount}.`,
    barangayCount === metadata.totalBarangays
      ? null
      : `Expected ${metadata.totalBarangays} barangays, got ${barangayCount}.`,
    lguBarangayMismatches.length === 0
      ? null
      : `LGU barangay count mismatch: ${JSON.stringify(lguBarangayMismatches)}.`,
    duplicateBarangays.length === 0
      ? null
      : `Duplicate barangays found: ${JSON.stringify(duplicateBarangays)}.`,
    duplicateLgus.length === 0
      ? null
      : `Duplicate LGUs found: ${JSON.stringify(duplicateLgus)}.`,
    unknownLgus.length === 0
      ? null
      : `Unknown LGUs found: ${JSON.stringify(unknownLgus)}.`,
  ].filter(Boolean) as string[];

  return {
    valid: errors.length === 0,
    errors,
    totals: {
      lguCount,
      municipalityCount,
      cityCount,
      barangayCount,
    },
  };
}

export const ORIENTAL_MINDORO_LOCATION_VALIDATION = validateOrientalMindoroLocations();

if (!ORIENTAL_MINDORO_LOCATION_VALIDATION.valid) {
  throw new Error(
    `Invalid Oriental Mindoro location dataset: ${ORIENTAL_MINDORO_LOCATION_VALIDATION.errors.join(" ")}`,
  );
}
