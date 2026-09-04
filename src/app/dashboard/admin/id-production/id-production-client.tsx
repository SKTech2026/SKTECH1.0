"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import FlippablePortraitID from "@/components/id/FlippablePortraitID";
import { formatEnumLabel } from "@/lib/sk-official";

type OfficialRecord = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  role: string;
  position: string | null;
  status: string;
  admissionStatus: string;
  municipalityId: string | null;
  municipality: string | null;
  barangayId: string | null;
  barangay: string | null;
  sitio: string | null;
  skFederationOfficer: boolean;
  skFederationPosition: string | null;
  dateElected: string;
  userStatus: string | null;
  photoUrl: string | null;
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
  const [selectedOfficialId, setSelectedOfficialId] = useState(officials[0]?.id ?? "");
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");

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

      const fullName = [official.firstName, official.middleName, official.lastName, official.suffix]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        fullName.includes(keyword) ||
        (official.municipality ?? "").toLowerCase().includes(keyword) ||
        (official.barangay ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [barangayId, municipalityId, officials, search]);

  const selectedOfficial = useMemo(
    () =>
      filteredOfficials.find((official) => official.id === selectedOfficialId) ??
      filteredOfficials[0] ??
      null,
    [filteredOfficials, selectedOfficialId],
  );

  const buildFullName = (official: OfficialRecord) =>
    [official.firstName, official.middleName, official.lastName, official.suffix]
      .filter(Boolean)
      .join(" ");

  const buildCredentialNumber = (official: OfficialRecord) =>
    official.id.replace(/-/g, "").slice(-12).toUpperCase();

  const buildPhotoUrl = (official: OfficialRecord) =>
    official.photoUrl?.startsWith("/") ? official.photoUrl : "/images/default-official.svg";

  const buildQrValue = (official: OfficialRecord) =>
    baseUrl ? `${baseUrl}/id/${official.id}` : `/id/${official.id}`;

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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid content-start gap-3">
          {filteredOfficials.length === 0 ? (
            <article className="rounded-2xl border border-glass-border bg-surface p-5 text-sm text-muted">
              No officials available for ID production under the current filters.
            </article>
          ) : (
            filteredOfficials.map((official) => (
              <article
                key={official.id}
                className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md transition ${
                  selectedOfficial?.id === official.id
                    ? "border-accent/50 bg-accent/10"
                    : "border-glass-border bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {buildFullName(official)}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatEnumLabel(official.position ?? official.role)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {official.barangay ?? "N/A"} | {official.municipality ?? "N/A"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      official.status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-rose-500/15 text-rose-200"
                    }`}
                  >
                    {official.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 text-accent">
                    {buildCredentialNumber(official)}
                  </span>
                  <span className="rounded-full border border-glass-border bg-surface-elevated/60 px-2.5 py-1 text-muted">
                    User: {official.userStatus ?? "NO_ACCOUNT"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOfficialId(official.id)}
                    className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
                  >
                    Preview
                  </button>
                  <Link
                    href={`/id/${official.id}`}
                    target="_blank"
                    className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
                  >
                    Print
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md">
          {selectedOfficial ? (
            <>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Production Preview</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {buildFullName(selectedOfficial)}
                </h3>
              </div>
              <FlippablePortraitID
                fullName={buildFullName(selectedOfficial)}
                position={formatEnumLabel(selectedOfficial.position ?? selectedOfficial.role)}
                skfedPosition={
                  selectedOfficial.skFederationOfficer
                    ? formatEnumLabel(selectedOfficial.skFederationPosition)
                    : null
                }
                barangay={selectedOfficial.barangay ?? "Not specified"}
                municipality={selectedOfficial.municipality ?? "Not specified"}
                sitio={selectedOfficial.sitio}
                dateElected={selectedOfficial.dateElected}
                idNumber={buildCredentialNumber(selectedOfficial)}
                qrValue={buildQrValue(selectedOfficial)}
                photoUrl={buildPhotoUrl(selectedOfficial)}
                registryStatus={selectedOfficial.status}
                sktechLogoUrl="/sk-tech-logo.png"
                provincialSealUrl="/images/provincial-seal-logo.png"
                skfedLogoUrl="/login-logo.png"
              />
            </>
          ) : (
            <p className="text-sm text-muted">No ID preview available.</p>
          )}
        </aside>
      </section>
    </div>
  );
}
