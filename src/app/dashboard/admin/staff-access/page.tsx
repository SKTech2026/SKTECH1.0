"use client";

import { useEffect, useState } from "react";

import TerminationConfirmModal from "@/components/admin/TerminationConfirmModal";

type StaffAccessItem = {
  id: string;
  name: string | null;
  email: string | null;
  employeeId: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE" | "TERMINATED";
  createdAt: string;
};

type StaffAccessResponse = {
  data: StaffAccessItem[];
};

export default function AdminStaffAccessPage() {
  const pageSize = 10;
  const [records, setRecords] = useState<StaffAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [terminationRecord, setTerminationRecord] = useState<StaffAccessItem | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredRecords = records.filter((record) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [record.name, record.email, record.employeeId, record.status]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query));
  });
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = filteredRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredRecords.length);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/staff-access", { cache: "no-store" });
      const payload = (await response.json()) as StaffAccessResponse | { error?: string };
      if (!response.ok || !("data" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Failed to load staff users.");
      }
      setRecords(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const terminateStaff = async (reason: string) => {
    if (!terminationRecord) return;
    setSavingId(terminationRecord.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/staff-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "terminate",
          userId: terminationRecord.id,
          terminationReason: reason,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to terminate staff account.");
      setTerminationRecord(null);
      setSuccess("Staff account terminated and preserved for audit history.");
      await loadRecords();
    } catch (terminationError) {
      setError(
        terminationError instanceof Error
          ? terminationError.message
          : "Failed to terminate staff account.",
      );
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const toggleStatus = async (userId: string, nextStatus: "APPROVED" | "INACTIVE") => {
    setSavingId(userId);
    setError(null);
    try {
      const response = await fetch("/api/staff-access", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update staff status.");
      }
      await loadRecords();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Access Governance
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Staff Access Approval</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Toggle staff account status to activate or suspend access to provincial modules.
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

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Staff Access</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {filteredRecords.length} {filteredRecords.length === 1 ? "staff" : "staff members"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Review account access and preserve staff history.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search staff</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search staff, email, or ID"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Staff</th>
              <th className="px-5 py-3.5 font-semibold">Employee ID</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">Created</th>
              <th className="px-5 py-3.5 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                  <span className="font-semibold text-slate-700">Loading staff accounts</span>
                  <span className="mt-1 block text-xs">Fetching the latest access records...</span>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                  <span className="font-semibold text-slate-700">No staff records found</span>
                  <span className="mt-1 block text-xs">Try a different search or check back later.</span>
                </td>
              </tr>
            ) : (
              pageRecords.map((record) => {
                const isApproved = record.status === "APPROVED";
                const isTerminated = record.status === "TERMINATED";
                const nextStatus = isApproved ? "INACTIVE" : "APPROVED";
                const displayName = record.name ?? "Unnamed Staff";
                const initials = displayName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase() || record.email?.slice(0, 2).toUpperCase() || "ST";
                const statusClass = {
                  APPROVED: "bg-emerald-100 text-emerald-700",
                  PENDING: "bg-amber-100 text-amber-700",
                  INACTIVE: "bg-slate-100 text-slate-600",
                  TERMINATED: "bg-rose-100 text-rose-700",
                  REJECTED: "bg-red-100 text-red-700",
                }[record.status];
                return (
                  <tr key={record.id} className="text-slate-700 transition hover:bg-sky-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{displayName}</p>
                          <p className="truncate text-xs text-slate-500">{record.email ?? "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{record.employeeId ?? "--"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {!isTerminated ? <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={savingId === record.id}
                          onClick={() => void toggleStatus(record.id, nextStatus)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingId === record.id
                            ? "Updating..."
                            : isApproved
                              ? "Set Inactive"
                              : "Approve Staff"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTerminationRecord(record)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Terminate
                        </button>
                      </div> : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Showing {rangeStart}-{rangeEnd} of {filteredRecords.length}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="min-w-16 text-center text-xs font-semibold text-slate-600">Page {currentPage} of {pageCount}</span>
            <button
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>
      <TerminationConfirmModal
        open={Boolean(terminationRecord)}
        title="Terminate Staff Account"
        subjectName={terminationRecord?.name ?? "Unnamed Staff"}
        subjectType="staff"
        onClose={() => {
          if (!savingId) setTerminationRecord(null);
        }}
        onConfirm={terminateStaff}
        loading={Boolean(terminationRecord && savingId === terminationRecord.id)}
      />
    </div>
  );
}
