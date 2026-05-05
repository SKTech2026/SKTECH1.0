"use client";

import { useEffect, useState } from "react";

type StaffAccessItem = {
  id: string;
  name: string | null;
  email: string | null;
  employeeId: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
  createdAt: string;
};

type StaffAccessResponse = {
  data: StaffAccessItem[];
};

export default function AdminStaffAccessPage() {
  const [records, setRecords] = useState<StaffAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-elevated text-left text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-5 py-4">Staff</th>
              <th className="px-5 py-4">Employee ID</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  Loading staff accounts...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  No staff records found.
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const isApproved = record.status === "APPROVED";
                const nextStatus = isApproved ? "INACTIVE" : "APPROVED";
                return (
                  <tr key={record.id} className="text-foreground">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{record.name ?? "Unnamed Staff"}</p>
                      <p className="text-xs text-muted">{record.email ?? "No email"}</p>
                    </td>
                    <td className="px-5 py-4 text-muted">{record.employeeId ?? "--"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isApproved
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={savingId === record.id}
                        onClick={() => void toggleStatus(record.id, nextStatus)}
                        className="rounded-lg border border-glass-border bg-surface/45 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === record.id
                          ? "Updating..."
                          : isApproved
                            ? "Set Inactive"
                            : "Approve Staff"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
