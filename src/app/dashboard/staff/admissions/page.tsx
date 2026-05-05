"use client";

import { AdmissionStatus, OfficialPosition } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";

type AdmissionRecord = {
  id: string;
  userId: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  birthDate: string | null;
  province: string | null;
  email: string | null;
  contactNo: string | null;
  address: string | null;
  municipalityId: string | null;
  municipality: string | null;
  barangay: string | null;
  position: OfficialPosition | null;
  dateElected: string | null;
  termEnd: string | null;
  proofDocumentUrl: string | null;
  proofDocumentName: string | null;
  proofDocumentType: string | null;
  admissionStatus: AdmissionStatus;
  createdAt: string;
};

type FilterMunicipality = {
  id: string;
  name: string;
  province: string;
};

type ApiResponse = {
  data: AdmissionRecord[];
  filters: {
    municipalities: FilterMunicipality[];
  };
};

const formatEnumLabel = (value: string | null) => {
  if (!value) return "N/A";
  return value
    .toLowerCase()
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

const formatDate = (value: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

export default function StaffAdmissionsPage() {
  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [municipalities, setMunicipalities] = useState<FilterMunicipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AdmissionRecord | null>(null);
  const [search, setSearch] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (municipalityFilter) params.set("municipalityId", municipalityFilter);

      const response = await fetch(`/api/staff/admissions?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiResponse | { error?: string };

      if (!response.ok || !("data" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Failed to load admissions.");
      }

      setRecords(payload.data);
      setMunicipalities(payload.filters.municipalities);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load admissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, action: "APPROVE" | "REJECT") => {
    let reason: string | null = null;
    if (action === "REJECT") {
      const value = window.prompt("Provide rejection reason:");
      if (!value || value.trim().length < 3) {
        setError("Rejection reason is required (minimum 3 characters).");
        return;
      }
      reason = value.trim();
    }

    setSavingId(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/staff/admissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action,
          reason,
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update admission.");
      }

      setSuccess(payload.message ?? "Admission updated.");
      await loadRecords();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  };

  const pendingCount = useMemo(
    () => records.filter((item) => item.admissionStatus === "PENDING").length,
    [records],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Municipal Admission Desk
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">SK Official Admissions</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Review pending official submissions in your assigned municipality and approve or reject with audit-safe actions.
        </p>
        <p className="mt-3 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
          Pending Records: {pendingCount}
        </p>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
        <h3 className="text-lg font-semibold text-foreground">Search & Filters</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, barangay..."
              className="mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Municipality</label>
            <select
              value={municipalityFilter}
              onChange={(event) => setMunicipalityFilter(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40"
            >
              <option value="">Assigned municipality</option>
              {municipalities.map((municipality) => (
                <option key={municipality.id} value={municipality.id}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void loadRecords()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setMunicipalityFilter("");
              void loadRecords();
            }}
            className="rounded-lg border border-glass-border bg-surface-elevated/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Loading pending admissions...</p>
        ) : records.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No pending admissions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-surface-elevated text-left text-xs uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-5 py-4">Full Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Municipality</th>
                  <th className="px-5 py-4">Barangay</th>
                  <th className="px-5 py-4">Position</th>
                  <th className="px-5 py-4">Proof</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-foreground">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-4 font-medium">
                      {[record.firstName, record.middleName, record.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td className="px-5 py-4 text-muted">{record.email ?? "No email"}</td>
                    <td className="px-5 py-4 text-muted">{record.municipality ?? "N/A"}</td>
                    <td className="px-5 py-4 text-muted">{record.barangay ?? "N/A"}</td>
                    <td className="px-5 py-4">{formatEnumLabel(record.position)}</td>
                    <td className="px-5 py-4 text-muted">
                      {record.proofDocumentUrl ? (
                        <a
                          href={record.proofDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-accent hover:underline"
                        >
                          {record.proofDocumentName || "Open proof"}
                        </a>
                      ) : (
                        "No proof"
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          disabled={savingId === record.id}
                          onClick={() => void updateStatus(record.id, "APPROVE")}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === record.id ? "Saving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={savingId === record.id}
                          onClick={() => void updateStatus(record.id, "REJECT")}
                          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRecord ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-glass-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Admission Details</h3>
                <p className="text-sm text-muted">
                  Submitted: {new Date(selectedRecord.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg border border-glass-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-surface-elevated/60"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Full Name</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {[selectedRecord.firstName, selectedRecord.middleName, selectedRecord.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Birth Date</p>
                <p className="mt-1 text-sm text-foreground">{formatDate(selectedRecord.birthDate)}</p>
              </div>
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Province</p>
                <p className="mt-1 text-sm text-foreground">{selectedRecord.province ?? "N/A"}</p>
              </div>
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Municipality / Barangay</p>
                <p className="mt-1 text-sm text-foreground">
                  {(selectedRecord.municipality ?? "N/A") + " / " + (selectedRecord.barangay ?? "N/A")}
                </p>
              </div>
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Position</p>
                <p className="mt-1 text-sm text-foreground">{formatEnumLabel(selectedRecord.position)}</p>
              </div>
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Term</p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(selectedRecord.dateElected)} - {formatDate(selectedRecord.termEnd)}
                </p>
              </div>
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Email</p>
                <p className="mt-1 text-sm text-foreground">{selectedRecord.email ?? "N/A"}</p>
              </div>
              <div className="rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Contact</p>
                <p className="mt-1 text-sm text-foreground">{selectedRecord.contactNo ?? "N/A"}</p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">Address</p>
              <p className="mt-1 text-sm text-foreground">{selectedRecord.address ?? "N/A"}</p>
            </div>

            <div className="mt-3 rounded-lg border border-glass-border bg-surface-elevated/40 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">Proof of Office</p>
              {selectedRecord.proofDocumentUrl ? (
                <a
                  href={selectedRecord.proofDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-accent hover:underline"
                >
                  {selectedRecord.proofDocumentName || "Open uploaded proof"}
                </a>
              ) : (
                <p className="mt-1 text-sm text-muted">No proof uploaded.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
