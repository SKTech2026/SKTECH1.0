import { ORIENTAL_MINDORO_LOCATIONS } from "@/data/oriental-mindoro-locations";

export type StoredLocation = {
  id: string;
  name: string;
  province: string;
  barangays: readonly { id: string; name: string }[];
};

export type CanonicalOption = {
  id: string;
  name: string;
  province: string;
  legacy?: boolean;
  unavailable?: boolean;
  barangays: { id: string; name: string; legacy?: boolean }[];
};

const key = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .trim().toLowerCase().replace(/\bsta\.?(?=\s|$)/g, "santa")
  .replace(/\bsto\.?(?=\s|$)/g, "santo")
  .replace(/^(villa|barangay) /, "").replace(/[^a-z0-9]/g, "");
const exactKey = (name: string) => name.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");

export function canonicalLocationOptions(
  rows: readonly StoredLocation[],
  saved?: { municipalityId?: string | null; barangayId?: string | null },
): CanonicalOption[] {
  const result: CanonicalOption[] = [];
  for (const lgu of ORIENTAL_MINDORO_LOCATIONS.lgus) {
    const names = [lgu.name, ...(lgu.aliases ?? [])];
    const matches = rows.filter((row) => row.province === "Oriental Mindoro" &&
      names.some((name) => name.toLowerCase() === row.name.toLowerCase()));
    if (matches.length !== 1) continue;
    const row = matches[0];
    const barangays: CanonicalOption["barangays"] = lgu.barangays.map((name, index) => {
      const exact = row.barangays.filter((barangay) => exactKey(barangay.name) === exactKey(name));
      const aliasCollision = lgu.barangays.some((other) =>
        exactKey(other) !== exactKey(name) && key(other) === key(name));
      const candidates = exact.length || aliasCollision ? exact :
        row.barangays.filter((barangay) => key(barangay.name) === key(name));
      if (candidates.length === 1) return { id: candidates[0].id, name };
      return { id: `canonical:${row.id}:${index}`, name: `${name} (pending import)`, unavailable: true };
    });
    const selected = row.barangays.find((barangay) => barangay.id === saved?.barangayId);
    if (selected && !barangays.some((barangay) => barangay.id === selected.id)) {
      barangays.push({ id: selected.id, name: `${selected.name} (saved legacy value)`, legacy: true });
    }
    result.push({ id: row.id, name: lgu.name, province: row.province, barangays });
  }
  const savedRow = rows.find((row) => row.id === saved?.municipalityId);
  if (savedRow && !result.some((row) => row.id === savedRow.id)) {
    const selected = savedRow.barangays.find((barangay) => barangay.id === saved?.barangayId);
    result.push({ id: savedRow.id, name: `${savedRow.name} (saved legacy value)`,
      province: savedRow.province, legacy: true,
      barangays: selected ? [{ id: selected.id, name: `${selected.name} (saved legacy value)`, legacy: true }] : [] });
  }
  return result;
}
