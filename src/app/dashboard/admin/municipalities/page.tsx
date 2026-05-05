"use client";

import { useEffect, useMemo, useState } from "react";

type MunicipalityRecord = {
  id: string;
  name: string;
  province: string;
  officerCount: number;
  admissionCount: number;
  barangayCount: number;
  municipalPresident: {
    id: string;
    name: string | null;
    userId: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
  } | null;
};

type StaffOption = {
  id: string;
  name: string | null;
  userId: string | null;
  assignedMunicipality: {
    id: string;
    name: string;
    province: string;
  } | null;
};

type MunicipalityApiPayload = {
  data: MunicipalityRecord[];
  staffOptions: StaffOption[];
};

type CreateFormState = {
  name: string;
  province: string;
  presidentId: string;
};

type EditFormState = {
  id: string;
  name: string;
  province: string;
  presidentId: string;
};

const emptyCreateState: CreateFormState = {
  name: "",
  province: "Oriental Mindoro",
  presidentId: "",
};

export default function AdminMunicipalitiesPage() {
  const [records, setRecords] = useState<MunicipalityRecord[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateState);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/municipalities", { cache: "no-store" });
      const payload = (await response.json()) as MunicipalityApiPayload | { error?: string };

      if (!response.ok || !("data" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Failed to load municipalities.");
      }

      setRecords(payload.data);
      setStaffOptions(payload.staffOptions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totals = useMemo(() => {
    const municipalityCount = records.length;
    const officerCount = records.reduce((sum, item) => sum + item.officerCount, 0);
    const assignedPresidents = records.filter((item) => item.municipalPresident).length;

    return { municipalityCount, officerCount, assignedPresidents };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return records;
    }

    return records.filter((record) => {
      const presidentName = record.municipalPresident?.name?.toLowerCase() ?? "";
      return (
        record.name.toLowerCase().includes(keyword) ||
        record.province.toLowerCase().includes(keyword) ||
        presidentName.includes(keyword)
      );
    });
  }, [records, searchQuery]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/municipalities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          province: createForm.province,
          presidentId: createForm.presidentId || null,
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create municipality.");
      }

      setSuccess(payload.message ?? "Municipality created.");
      setCreateForm(emptyCreateState);
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Create failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/municipalities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          name: editForm.name,
          province: editForm.province,
          presidentId: editForm.presidentId || null,
        }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update municipality.");
      }

      setSuccess(payload.message ?? "Municipality updated.");
      setEditForm(null);
      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const shouldDelete = window.confirm(
      `Delete ${name}? This only works when no linked staff, officers, admissions, or barangays exist.`,
    );

    if (!shouldDelete) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/municipalities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete municipality.");
      }

      setSuccess(payload.message ?? "Municipality deleted.");
      if (editForm?.id === id) {
        setEditForm(null);
      }
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Governance Hierarchy
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Municipality Management</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Create municipalities, assign Municipal Presidents, and monitor municipality-level SK
          officer distribution.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Municipalities", value: totals.municipalityCount, tone: "text-accent" },
          { label: "Assigned Presidents", value: totals.assignedPresidents, tone: "text-emerald-300" },
          { label: "Total Officers", value: totals.officerCount, tone: "text-indigo-300" },
        ].map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{metric.label}</p>
            <p className={`mt-2 text-3xl font-bold ${metric.tone}`}>{metric.value}</p>
          </article>
        ))}
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

      <section className="grid gap-4 xl:grid-cols-2">
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md"
        >
          <h3 className="text-lg font-semibold text-foreground">Create Municipality</h3>
          <div className="mt-4 grid gap-3">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">
                Municipality Name
              </label>
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, name: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                placeholder="Calapan City"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Province</label>
              <input
                value={createForm.province}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, province: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                placeholder="Oriental Mindoro"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">
                Assign Municipal President (Optional)
              </label>
              <select
                value={createForm.presidentId}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, presidentId: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              >
                <option value="">Unassigned</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {(staff.name ?? "Unnamed Staff") + (staff.userId ? ` (${staff.userId})` : "")}
                    {staff.assignedMunicipality
                      ? ` - currently ${staff.assignedMunicipality.name}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create Municipality"}
          </button>
        </form>

        <div className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-lg font-semibold text-foreground">Edit Municipality</h3>
          {editForm ? (
            <form onSubmit={handleUpdate} className="mt-4 grid gap-3">
              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">
                  Municipality Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, name: event.target.value } : previous,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">Province</label>
                <input
                  value={editForm.province}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, province: event.target.value } : previous,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">
                  Municipal President
                </label>
                <select
                  value={editForm.presidentId}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, presidentId: event.target.value } : previous,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                >
                  <option value="">Unassigned</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {(staff.name ?? "Unnamed Staff") +
                        (staff.userId ? ` (${staff.userId})` : "")}
                      {staff.assignedMunicipality
                        ? ` - currently ${staff.assignedMunicipality.name}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-1 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditForm(null)}
                  className="rounded-lg border border-glass-border bg-surface-elevated/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Select a municipality below and click <span className="font-semibold">Edit</span>.
            </p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        <div className="border-b border-glass-border p-4">
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Search Municipality</label>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Type municipality, province, or president..."
            className="mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
          />
        </div>
        <div className="h-[400px] overflow-y-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 bg-surface-elevated text-left text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-5 py-4">Municipality</th>
                <th className="px-5 py-4">Province</th>
                <th className="px-5 py-4">Assigned Staff</th>
                <th className="px-5 py-4">Municipal President</th>
                <th className="px-5 py-4">Officers</th>
                <th className="px-5 py-4">Admissions</th>
                <th className="px-5 py-4">Barangays</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-foreground">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted">
                    Loading municipalities...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted">
                    No municipalities found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-4 font-medium">{record.name}</td>
                    <td className="px-5 py-4 text-muted">{record.province}</td>
                    <td className="px-5 py-4">{record.municipalPresident ? 1 : 0}</td>
                    <td className="px-5 py-4 text-muted">
                      {record.municipalPresident
                        ? `${record.municipalPresident.name ?? "Unnamed"}${
                            record.municipalPresident.userId
                              ? ` (${record.municipalPresident.userId})`
                              : ""
                          }`
                        : "Unassigned"}
                    </td>
                    <td className="px-5 py-4">{record.officerCount}</td>
                    <td className="px-5 py-4">{record.admissionCount}</td>
                    <td className="px-5 py-4">{record.barangayCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              id: record.id,
                              name: record.name,
                              province: record.province,
                              presidentId: record.municipalPresident?.id ?? "",
                            })
                          }
                          className="rounded-lg border border-glass-border bg-surface/45 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(record.id, record.name)}
                          disabled={saving}
                          className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
