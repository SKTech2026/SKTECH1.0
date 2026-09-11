"use client";

import { AdmissionStatus, OfficialPosition } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";

import ProfileChangeRequests from "./profile-change-requests";

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
  const pageSize = 10;
  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [municipalities, setMunicipalities] = useState<FilterMunicipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AdmissionRecord | null>(null);
  const [rejectionRecordId, setRejectionRecordId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [search, setSearch] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [page, setPage] = useState(1);

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

  const updateStatus = async (id: string, action: "APPROVE" | "REJECT", providedReason?: string) => {
    const reason = action === "REJECT" ? providedReason?.trim() ?? "" : null;
    if (action === "REJECT" && (!reason || reason.length < 3)) {
        setError("Rejection reason is required (minimum 3 characters).");
        return;
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
      setRejectionRecordId(null);
      setRejectionReason("");
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
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = records.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, records.length);

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

      <ProfileChangeRequests />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Staff Admissions</h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{pendingCount} pending</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{records.length} shown</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Review official submissions assigned to your municipality.</p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,220px)] lg:max-w-2xl">
              <div>
                <label className="sr-only" htmlFor="admission-search">Search admissions</label>
                <input id="admission-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, barangay..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100" />
              </div>
              <div>
                <label className="sr-only" htmlFor="admission-municipality">Filter municipality</label>
                <select id="admission-municipality" value={municipalityFilter} onChange={(event) => setMunicipalityFilter(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100">
                  <option value="">Assigned municipality</option>
                  {municipalities.map((municipality) => <option key={municipality.id} value={municipality.id}>{municipality.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setPage(1); void loadRecords(); }} className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-700">Apply Filters</button>
            <button type="button" onClick={() => { setSearch(""); setMunicipalityFilter(""); setPage(1); void loadRecords(); }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Reset</button>
          </div>
        </div>
        {loading ? (
          <p className="px-5 py-12 text-center text-slate-500"><span className="font-semibold text-slate-700">Loading admissions</span><span className="mt-1 block text-xs">Fetching the latest submissions...</span></p>
        ) : records.length === 0 ? (
          <p className="px-5 py-12 text-center text-slate-500"><span className="font-semibold text-slate-700">No pending admissions found</span><span className="mt-1 block text-xs">Try adjusting the search or municipality filter.</span></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Applicant</th>
                  <th className="px-5 py-3.5 font-semibold">Email</th>
                  <th className="px-5 py-3.5 font-semibold">Municipality</th>
                  <th className="px-5 py-3.5 font-semibold">Barangay</th>
                  <th className="px-5 py-3.5 font-semibold">Position</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Proof</th>
                  <th className="px-5 py-3.5 font-semibold">Submitted</th>
                  <th className="px-5 py-3.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRecords.map((record) => {
                  const applicantName = [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
                  const initials = applicantName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || record.email?.slice(0, 2).toUpperCase() || "AP";
                  const statusClass = record.admissionStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : record.admissionStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
                  return (
                  <tr key={record.id} className="text-slate-700 transition hover:bg-sky-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{initials}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{applicantName || "Unnamed Applicant"}</p><p className="truncate text-xs text-slate-500">{formatDate(record.birthDate)}</p></div></div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{record.email ?? "No email"}</td>
                    <td className="px-5 py-4 text-slate-500">{record.municipality ?? "N/A"}</td>
                    <td className="px-5 py-4 text-slate-500">{record.barangay ?? "N/A"}</td>
                    <td className="px-5 py-4 text-slate-700">{formatEnumLabel(record.position)}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{record.admissionStatus}</span></td>
                    <td className="px-5 py-4 text-slate-500">
                      {record.proofDocumentUrl ? (
                        <a
                          href={record.proofDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-sky-700 hover:underline"
                        >
                          {record.proofDocumentName || "Open proof"}
                        </a>
                      ) : (
                        "No proof"
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          disabled={savingId === record.id}
                          onClick={() => void updateStatus(record.id, "APPROVE")}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === record.id ? "Saving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={savingId === record.id}
                          onClick={() => {
                            setError(null);
                            setRejectionRecordId(record.id);
                            setRejectionReason("");
                          }}
                          className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Showing {rangeStart}-{rangeEnd} of {records.length}</p>
          <div className="flex items-center gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="min-w-16 text-center text-xs font-semibold text-slate-600">Page {currentPage} of {pageCount}</span><button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div>
        </div>
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

      {rejectionRecordId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-glass-border bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-foreground">Reject Admission</h3>
            <p className="mt-2 text-sm text-muted">Provide a reason for rejecting this admission request.</p>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
              autoFocus
              placeholder="Rejection reason"
              className="mt-4 w-full rounded-lg border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setRejectionRecordId(null); setRejectionReason(""); }} className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-elevated/60">
                Cancel
              </button>
              <button type="button" disabled={savingId === rejectionRecordId} onClick={() => void updateStatus(rejectionRecordId, "REJECT", rejectionReason)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {savingId === rejectionRecordId ? "Saving..." : "Reject Admission"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
