"use client";

import { useEffect, useMemo, useState } from "react";

type ArchiveType = "all" | "officials" | "staff";

type ArchiveRecord = {
  id: string;
  type: "official" | "staff";
  name: string;
  email: string | null;
  position: string | null;
  role: string | null;
  municipalityId: string | null;
  municipalityName: string | null;
  barangayId: string | null;
  barangayName: string | null;
  admissionStatus: string | null;
  officialStatus: string | null;
  userStatus: string | null;
  status: string;
  terminatedAt: string | null;
  terminatedById: string | null;
  terminationReason: string | null;
};

type BarangayOption = {
  id: string;
  name: string;
  municipalityId: string;
};

type MunicipalityOption = {
  id: string;
  name: string;
  province: string;
  barangays: BarangayOption[];
};

type ArchiveResponse = {
  records: ArchiveRecord[];
  municipalities: MunicipalityOption[];
  barangays: BarangayOption[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: {
    total: number;
    officials: number;
    staff: number;
  };
};

type MunicipalityGroup = {
  key: string;
  name: string;
  province: string | null;
  officialsByBarangay: Array<{
    key: string;
    name: string;
    records: ArchiveRecord[];
  }>;
  staff: ArchiveRecord[];
  total: number;
};

const pageSizeOptions = [10, 20, 50];

const formatDate = (value: string | null) => {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getRoleLabel = (record: ArchiveRecord) =>
  record.type === "official"
    ? record.position ?? record.role ?? "Official"
    : record.role ?? "Staff";

const getRangeLabel = (pagination: ArchiveResponse["pagination"]) => {
  if (pagination.total === 0) return "Showing 0 of 0";
  const first = (pagination.page - 1) * pagination.pageSize + 1;
  const last = Math.min(first + pagination.pageSize - 1, pagination.total);
  return `Showing ${first}-${last} of ${pagination.total}`;
};

export default function ArchiveBinClient() {
  const [archiveType, setArchiveType] = useState<ArchiveType>("all");
  const [municipalityId, setMunicipalityId] = useState("");
  const [barangayId, setBarangayId] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState<ArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMunicipalities, setOpenMunicipalities] = useState<Set<string>>(new Set());
  const [openBarangays, setOpenBarangays] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (archiveType === "staff") {
      setBarangayId("");
    }
  }, [archiveType]);

  useEffect(() => {
    setBarangayId("");
  }, [municipalityId]);

  useEffect(() => {
    const controller = new AbortController();

    const loadArchive = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          type: archiveType,
          page: String(page),
          pageSize: String(pageSize),
        });
        if (municipalityId) params.set("municipalityId", municipalityId);
        if (barangayId && archiveType !== "staff") params.set("barangayId", barangayId);
        if (search.trim()) params.set("search", search.trim());

        const response = await fetch(`/api/admin/archive?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json()) as ArchiveResponse | { error?: string };
        if (!response.ok || !("records" in body)) {
          throw new Error(("error" in body && body.error) || "Failed to load archive records.");
        }
        setPayload(body);
        setOpenMunicipalities(new Set(body.records.map((record) => record.municipalityId ?? "unassigned")));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load archive records.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadArchive();
    return () => controller.abort();
  }, [archiveType, barangayId, municipalityId, page, pageSize, search]);

  const selectedMunicipality = payload?.municipalities.find(
    (municipality) => municipality.id === municipalityId,
  );
  const visibleBarangays = municipalityId
    ? selectedMunicipality?.barangays ?? []
    : payload?.barangays ?? [];
  const barangayDisabled = archiveType === "staff" || !municipalityId || visibleBarangays.length === 0;

  const groupedRecords = useMemo<MunicipalityGroup[]>(() => {
    if (!payload) return [];

    const municipalityLookup = new Map(
      payload.municipalities.map((municipality) => [municipality.id, municipality]),
    );
    const groups = new Map<string, { records: ArchiveRecord[]; municipality: MunicipalityOption | null }>();

    for (const record of payload.records) {
      const key = record.municipalityId ?? "unassigned";
      const existing = groups.get(key);
      if (existing) {
        existing.records.push(record);
      } else {
        groups.set(key, {
          records: [record],
          municipality: record.municipalityId ? municipalityLookup.get(record.municipalityId) ?? null : null,
        });
      }
    }

    return Array.from(groups.entries()).map(([key, group]) => {
      const officials = group.records.filter((record) => record.type === "official");
      const staff = group.records.filter((record) => record.type === "staff");
      const barangayGroups = new Map<string, ArchiveRecord[]>();

      for (const official of officials) {
        const barangayKey = official.barangayId ?? "unassigned";
        const records = barangayGroups.get(barangayKey) ?? [];
        records.push(official);
        barangayGroups.set(barangayKey, records);
      }

      return {
        key,
        name: group.municipality?.name ?? group.records[0]?.municipalityName ?? "Unassigned Municipality",
        province: group.municipality?.province ?? null,
        officialsByBarangay: Array.from(barangayGroups.entries()).map(([barangayKey, records]) => ({
          key: `${key}-${barangayKey}`,
          name: records[0]?.barangayName ?? "Unassigned Barangay",
          records,
        })),
        staff,
        total: group.records.length,
      };
    });
  }, [payload]);

  const resetToFirstPage = () => setPage(1);

  const toggleMunicipality = (key: string) => {
    setOpenMunicipalities((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleBarangay = (key: string) => {
    setOpenBarangays((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <section className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md md:grid-cols-[minmax(0,1.2fr)_minmax(160px,0.7fr)_minmax(160px,0.7fr)_minmax(120px,0.45fr)]">
        <label className="space-y-2 text-sm font-semibold text-foreground">
          Search archive
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Name, email, municipality..."
            className="w-full rounded-xl border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
          />
        </label>

        <label className="space-y-2 text-sm font-semibold text-foreground">
          Record type
          <select
            value={archiveType}
            onChange={(event) => {
              setArchiveType(event.target.value as ArchiveType);
              resetToFirstPage();
            }}
            className="w-full rounded-xl border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
          >
            <option value="all">All</option>
            <option value="officials">Officials</option>
            <option value="staff">Staff</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-semibold text-foreground">
          Page size
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              resetToFirstPage();
            }}
            className="w-full rounded-xl border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2 md:block">
          <div className="rounded-xl border border-glass-border bg-surface-elevated px-3 py-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Total</p>
            <p className="text-lg font-bold text-foreground">{payload?.summary.total ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md md:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-foreground">
          Municipality
          <select
            value={municipalityId}
            onChange={(event) => {
              setMunicipalityId(event.target.value);
              resetToFirstPage();
            }}
            className="w-full rounded-xl border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
          >
            <option value="">All municipalities</option>
            {payload?.municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-semibold text-foreground">
          Barangay
          <select
            value={barangayId}
            disabled={barangayDisabled}
            onChange={(event) => {
              setBarangayId(event.target.value);
              resetToFirstPage();
            }}
            className="w-full rounded-xl border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All barangays</option>
            {visibleBarangays.map((barangay) => (
              <option key={barangay.id} value={barangay.id}>
                {barangay.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Archived officials" value={payload?.summary.officials ?? 0} />
        <SummaryCard label="Archived staff" value={payload?.summary.staff ?? 0} />
        <SummaryCard label="Current page" value={payload?.records.length ?? 0} />
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="rounded-2xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
            Loading archive records...
          </p>
        ) : payload && payload.records.length === 0 ? (
          <p className="rounded-2xl border border-glass-border bg-surface p-6 text-center text-sm text-muted">
            No terminated records match the current filters.
          </p>
        ) : (
          groupedRecords.map((group) => {
            const isOpen = openMunicipalities.has(group.key);
            return (
              <article
                key={group.key}
                className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => toggleMunicipality(group.key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-surface-elevated/50 sm:px-5"
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base font-bold text-foreground">
                      {group.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {group.province ?? "No province"} - {group.total} archived records
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-lg text-accent transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    v
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-4 border-t border-glass-border p-4 sm:p-5">
                      {group.officialsByBarangay.map((barangay) => {
                        const barangayOpen = openBarangays.has(barangay.key);
                        return (
                          <div
                            key={barangay.key}
                            className="overflow-hidden rounded-xl border border-glass-border bg-surface-elevated/35"
                          >
                            <button
                              type="button"
                              onClick={() => toggleBarangay(barangay.key)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-elevated/50"
                              aria-expanded={barangayOpen}
                            >
                              <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                                Barangay {barangay.name}
                              </span>
                              <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                                <span>{barangay.records.length} officials</span>
                                <span
                                  className={`text-accent transition-transform duration-300 ${
                                    barangayOpen ? "rotate-180" : ""
                                  }`}
                                >
                                  v
                                </span>
                              </span>
                            </button>
                            <div
                              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                                barangayOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                              }`}
                            >
                              <div className="min-h-0 overflow-hidden">
                                <div className="grid gap-3 border-t border-glass-border p-3 sm:grid-cols-2">
                                  {barangay.records.map((record) => (
                                    <ArchiveRecordCard key={record.id} record={record} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {group.staff.length > 0 ? (
                        <div className="rounded-xl border border-glass-border bg-surface-elevated/35 p-3">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">Staff Accounts</h3>
                            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                              {group.staff.length} staff
                            </span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {group.staff.map((record) => (
                              <ArchiveRecordCard key={record.id} record={record} />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {payload ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-surface p-4 text-sm text-muted shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <span>{getRangeLabel(payload.pagination)}</span>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              disabled={!payload.pagination.hasPreviousPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-glass-border px-3 py-2 font-semibold text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Page {payload.pagination.page} of {payload.pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={!payload.pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-glass-border px-3 py-2 font-semibold text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ArchiveRecordCard({ record }: { record: ArchiveRecord }) {
  return (
    <article className="min-w-0 rounded-xl border border-glass-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-200">
          Terminated
        </span>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          {record.type === "official" ? "Official" : "Staff"}
        </span>
      </div>
      <h3 className="mt-3 break-words text-base font-bold text-foreground">{record.name}</h3>
      {record.email ? <p className="mt-1 break-words text-xs text-muted">{record.email}</p> : null}
      <dl className="mt-4 grid gap-2 text-xs text-muted">
        <InfoRow label="Role" value={getRoleLabel(record)} />
        <InfoRow label="Municipality" value={record.municipalityName ?? "Unassigned"} />
        {record.type === "official" ? (
          <InfoRow label="Barangay" value={record.barangayName ?? "Unassigned"} />
        ) : null}
        <InfoRow label="Terminated" value={formatDate(record.terminatedAt)} />
        <InfoRow label="Reason" value={record.terminationReason ?? "Not recorded"} />
        <InfoRow label="Terminated by" value={record.terminatedById ?? "Not recorded"} />
      </dl>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)]">
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}
