"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type OfficialRecord = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  admissionStatus: string;
  municipalityId: string | null;
  municipality: string | null;
  barangayId: string | null;
  barangay: string | null;
  userStatus: string | null;
};

type MunicipalityOption = {
  id: string;
  name: string;
  province: string;
  barangays: {
    id: string;
    name: string;
  }[];
};

type IdProductionClientProps = {
  officials: OfficialRecord[];
  municipalities: MunicipalityOption[];
};

export default function IdProductionClient({
  officials,
  municipalities,
}: IdProductionClientProps) {
  const [search, setSearch] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [barangayId, setBarangayId] = useState("");

  const selectedMunicipality = useMemo(
    () => municipalities.find((entry) => entry.id === municipalityId) ?? null,
    [municipalityId, municipalities],
  );

  const filteredBarangays = useMemo(
    () => (selectedMunicipality ? selectedMunicipality.barangays : []),
    [selectedMunicipality],
  );

  const filteredOfficials = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return officials.filter((official) => {
      if (municipalityId && official.municipalityId !== municipalityId) {
        return false;
      }
      if (barangayId && official.barangayId !== barangayId) {
        return false;
      }
      if (!keyword) {
        return true;
      }

      const fullName = `${official.firstName} ${official.lastName}`.toLowerCase();
      return (
        fullName.includes(keyword) ||
        (official.municipality ?? "").toLowerCase().includes(keyword) ||
        (official.barangay ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [barangayId, municipalityId, officials, search]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
        <h3 className="text-lg font-semibold text-foreground">Filter by Area</h3>
        <p className="mt-1 text-sm text-muted">
          Cascading municipality and barangay filters for ID production scope.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, municipality, barangay..."
              className="mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Municipality</label>
            <select
              value={municipalityId}
              onChange={(event) => {
                setMunicipalityId(event.target.value);
                setBarangayId("");
              }}
              className="mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40"
            >
              <option value="">All municipalities</option>
              {municipalities.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Barangay</label>
            <select
              value={barangayId}
              onChange={(event) => setBarangayId(event.target.value)}
              disabled={!selectedMunicipality}
              className="mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40 disabled:opacity-60"
            >
              <option value="">
                {selectedMunicipality ? "All barangays" : "Select municipality first"}
              </option>
              {filteredBarangays.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredOfficials.length === 0 ? (
          <article className="rounded-2xl border border-glass-border bg-surface p-5 text-sm text-muted">
            No officials available for ID production under the current filters.
          </article>
        ) : (
          filteredOfficials.map((official) => (
            <article
              key={official.id}
              className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {official.firstName} {official.lastName}
              </h3>
              <p className="mt-1 text-sm text-muted">{official.role}</p>
              <p className="mt-1 text-xs text-muted">
                {official.barangay ?? "N/A"} | {official.municipality ?? "N/A"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 text-accent">
                  Admission: {official.admissionStatus}
                </span>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-emerald-200">
                  User: {official.userStatus ?? "NO_ACCOUNT"}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/id/${official.id}`}
                  target="_blank"
                  className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
                >
                  View ID
                </Link>
                <Link
                  href={`/id/${official.id}`}
                  target="_blank"
                  className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
                >
                  Download / Print
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
