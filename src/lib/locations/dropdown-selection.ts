export type DropdownLgu = {
  id: string;
  barangays: readonly { id: string }[];
};

export function validBarangaySelection(
  lguId: string,
  barangayId: string,
  lgus: readonly DropdownLgu[],
): string {
  const lgu = lgus.find((entry) => entry.id === lguId);
  return lgu?.barangays.some((entry) => entry.id === barangayId) ? barangayId : "";
}
