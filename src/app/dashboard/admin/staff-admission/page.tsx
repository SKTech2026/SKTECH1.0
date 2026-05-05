"use client";

import { useEffect, useState } from "react";

type StaffAdmissionItem = {
  id: string;
  name: string;
  position: string;
  userId: string;
  municipalityId: string | null;
  municipalityName: string | null;
  municipalityProvince: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

type MunicipalityOption = {
  id: string;
  name: string;
  province: string;
  assignedPresident: {
    id: string;
    name: string | null;
    userId: string | null;
  } | null;
};

type StaffAdmissionResponse = {
  data: StaffAdmissionItem[];
  municipalities: MunicipalityOption[];
};

type CreateState = {
  name: string;
  position: string;
  userId: string;
  password: string;
  municipalityId: string;
};

type EditState = {
  id: string;
  name: string;
  position: string;
  userId: string;
  password: string;
  municipalityId: string;
};

const emptyCreateState: CreateState = {
  name: "",
  position: "",
  userId: "",
  password: "",
  municipalityId: "",
};

export default function AdminStaffAdmissionPage() {
  const [records, setRecords] = useState<StaffAdmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateState>(emptyCreateState);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [municipalityOptions, setMunicipalityOptions] = useState<MunicipalityOption[]>([]);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/staff-admission", { cache: "no-store" });
      const payload = (await response.json()) as StaffAdmissionResponse | { error?: string };
      if (!response.ok || !("data" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Failed to load staff records.");
      }
      setRecords(payload.data);
      setMunicipalityOptions(payload.municipalities ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/staff-admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create staff account.");
      }

      setSuccess(payload.message ?? "Staff account created.");
      setCreateForm(emptyCreateState);
      await loadRecords();
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
      const response = await fetch("/api/staff-admission", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update staff profile.");
      }

      setSuccess(payload.message ?? "Staff profile updated.");
      setEditForm(null);
      await loadRecords();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Staff Identity Management
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Staff Admission</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Create and edit STAFF login credentials and profile details.
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

      <section className="grid gap-4 xl:grid-cols-2">
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md"
        >
          <h3 className="text-lg font-semibold text-foreground">Create Staff Account</h3>
          <div className="mt-4 grid gap-3">
            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Name</label>
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, name: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                placeholder="Juan Dela Cruz"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Position</label>
              <input
                value={createForm.position}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, position: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                placeholder="Records Officer"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">
                Assigned Municipality
              </label>
              <select
                value={createForm.municipalityId}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    municipalityId: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                required
              >
                <option value="">Select municipality</option>
                {municipalityOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}, {item.province}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">User ID</label>
              <input
                value={createForm.userId}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, userId: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                placeholder="staff002"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.14em] text-muted">Password</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, password: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                placeholder="Minimum 8 characters"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create Staff Account"}
          </button>
        </form>

        <div className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-lg font-semibold text-foreground">Edit Staff Profile</h3>
          {editForm ? (
            <form onSubmit={handleUpdate} className="mt-4 grid gap-3">
              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">Name</label>
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
                <label className="text-xs uppercase tracking-[0.14em] text-muted">Position</label>
                <input
                  value={editForm.position}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, position: event.target.value } : previous,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">
                  Assigned Municipality
                </label>
                <select
                  value={editForm.municipalityId}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, municipalityId: event.target.value } : previous,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                  required
                >
                  <option value="">Select municipality</option>
                  {municipalityOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}, {item.province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">User ID</label>
                <input
                  value={editForm.userId}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, userId: event.target.value } : previous,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-muted">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, password: event.target.value } : previous,
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-glass-border bg-surface-elevated/70 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
                  placeholder="Leave blank to keep current password"
                />
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
              Select a staff record below and click <span className="font-semibold">Edit</span>.
            </p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface-elevated text-left text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Position</th>
              <th className="px-5 py-4">Municipality</th>
              <th className="px-5 py-4">User ID</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  Loading staff records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  No staff records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="text-foreground">
                  <td className="px-5 py-4 font-medium">{record.name || "Unnamed"}</td>
                  <td className="px-5 py-4 text-muted">{record.position || "--"}</td>
                  <td className="px-5 py-4 text-muted">
                    {record.municipalityName
                      ? `${record.municipalityName}, ${record.municipalityProvince ?? ""}`
                      : "--"}
                  </td>
                  <td className="px-5 py-4 text-muted">{record.userId || "--"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        record.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-amber-500/20 text-amber-200"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm({
                          id: record.id,
                          name: record.name,
                          position: record.position,
                          userId: record.userId,
                          password: "",
                          municipalityId: record.municipalityId ?? "",
                        })
                      }
                      className="rounded-lg border border-glass-border bg-surface/45 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
