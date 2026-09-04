"use client";

import {
  AdmissionStatus,
  OfficialPosition,
  OfficialStatus,
  SKFederationPosition,
  Sex,
} from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";

import SKOfficialAdmissionWizard from "@/components/admission/SKOfficialAdmissionWizard";
import {
  MunicipalityOption,
  SKOfficialAdmissionSubmissionPayload,
  formatEnumLabel,
  formatOfficialFullName,
} from "@/lib/sk-official";

type SKOfficialRecord = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  birthDate: string | null;
  sex: Sex | null;
  municipality: string | null;
  barangay: string | null;
  municipalityId: string | null;
  barangayId: string | null;
  sitio: string | null;
  position: OfficialPosition | null;
  skFederationOfficer: boolean;
  skFederationPosition: SKFederationPosition | null;
  dateElected: string | null;
  termEnd: string | null;
  admissionStatus: AdmissionStatus;
  status: OfficialStatus;
  email: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  data: SKOfficialRecord[];
  viewerRole: "ADMIN" | "STAFF";
  municipalities: MunicipalityOption[];
  pagination: {
    total: number;
    take: number;
    skip: number;
    pages: number;
  };
};

const formatDate = (value: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

export default function OfficialsPage() {
  const [officials, setOfficials] = useState<SKOfficialRecord[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<"ACCOUNT" | "WALK_IN">("ACCOUNT");
  const [editingOfficial, setEditingOfficial] = useState<SKOfficialRecord | null>(null);
  const [savingOfficialId, setSavingOfficialId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [admissionFilter, setAdmissionFilter] = useState<"" | AdmissionStatus>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [viewerRole, setViewerRole] = useState<"ADMIN" | "STAFF" | null>(null);

  const pageSize = 12;
  const isAdmin = viewerRole === "ADMIN";

  const fetchOfficials = useCallback(
    async (page = 0) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (municipalityFilter) params.set("municipalityId", municipalityFilter);
        if (admissionFilter) params.set("admissionStatus", admissionFilter);
        params.set("take", String(pageSize));
        params.set("skip", String(page * pageSize));

        const response = await fetch(`/api/officials?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiResponse | { error?: string };

        if (!response.ok || !("data" in payload)) {
          throw new Error(("error" in payload && payload.error) || "Failed to fetch officials.");
        }

        setOfficials(payload.data);
        setViewerRole(payload.viewerRole);
        setMunicipalities(payload.municipalities);
        setTotalCount(payload.pagination.total);
        setCurrentPage(page);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load officials.");
      } finally {
        setLoading(false);
      }
    },
    [admissionFilter, municipalityFilter, searchQuery],
  );

  useEffect(() => {
    void fetchOfficials(0);
  }, [fetchOfficials]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount]);

  const submitNewOfficial = async (payload: SKOfficialAdmissionSubmissionPayload) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/officials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          submissionMode,
        }),
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to create official.");
      }

      setSuccess(body.message ?? "Official record created.");
      setShowForm(false);
      await fetchOfficials(0);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create official.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveOfficial = async (payload: SKOfficialAdmissionSubmissionPayload) => {
    if (!editingOfficial) return;
    setSavingOfficialId(editingOfficial.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/officials/${editingOfficial.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update official.");
      }

      setSuccess(body.message ?? "Official record updated.");
      setEditingOfficial(null);
      await fetchOfficials(currentPage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update official.");
    } finally {
      setSavingOfficialId(null);
    }
  };

  const setOfficialStatus = async (official: SKOfficialRecord, nextStatus: OfficialStatus) => {
    setSavingOfficialId(official.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/officials/${official.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update official status.");
      }

      setSuccess(
        nextStatus === "ACTIVE"
          ? "Official record reactivated."
          : "Official record deactivated.",
      );
      await fetchOfficials(currentPage);
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : "Failed to update official status.",
      );
    } finally {
      setSavingOfficialId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Unified SK Official Registry
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground">SK Profiling</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              One synchronized source for admission, profiling records, and digital ID production.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((previous) => !previous)}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            {showForm ? "Close Form" : "Add Official"}
          </button>
        </div>
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

      {showForm ? (
        <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-lg font-semibold text-foreground">Create Official Admission Record</h3>
          <p className="mt-1 text-sm text-muted">
            Uses the same 4-step admission workflow as official self-submission.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSubmissionMode("ACCOUNT")}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                submissionMode === "ACCOUNT"
                  ? "border-accent/40 bg-accent/20 text-accent"
                  : "border-glass-border bg-surface-elevated/50 text-muted hover:bg-surface-elevated"
              }`}
            >
              Account Admission
            </button>
            <button
              type="button"
              onClick={() => setSubmissionMode("WALK_IN")}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                submissionMode === "WALK_IN"
                  ? "border-accent/40 bg-accent/20 text-accent"
                  : "border-glass-border bg-surface-elevated/50 text-muted hover:bg-surface-elevated"
              }`}
            >
              Walk-in Admission
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            {submissionMode === "ACCOUNT"
              ? "Email is required. Existing OFFICIAL account will be linked, otherwise an account is created."
              : "Walk-in allows optional email. A secure official identity record is still created and enrolled."}
          </p>
          <div className="mt-5">
            <SKOfficialAdmissionWizard
              municipalities={municipalities}
              includeEmail
              requireEmail={submissionMode === "ACCOUNT"}
              submitLabel={
                submissionMode === "ACCOUNT"
                  ? "Create Account Admission"
                  : "Create Walk-in Admission"
              }
              submitting={submitting}
              onSubmit={submitNewOfficial}
            />
          </div>
        </section>
      ) : null}

      {editingOfficial ? (
        <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Edit Official Profile</h3>
              <p className="mt-1 text-sm text-muted">
                Admin-only updates use the same canonical profile fields.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingOfficial(null)}
              className="rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
            >
              Cancel
            </button>
          </div>
          <div className="mt-5">
            <SKOfficialAdmissionWizard
              municipalities={municipalities}
              includeEmail
              requireEmail={false}
              initialStep={1}
              profileOnly
              submitLabel="Save Official Profile"
              submitting={savingOfficialId === editingOfficial.id}
              initialValues={{
                firstName: editingOfficial.firstName,
                middleName: editingOfficial.middleName,
                lastName: editingOfficial.lastName,
                suffix: editingOfficial.suffix,
                birthDate: editingOfficial.birthDate?.slice(0, 10) ?? "",
                sex: editingOfficial.sex,
                province: "Oriental Mindoro",
                municipalityId: editingOfficial.municipalityId ?? "",
                barangayId: editingOfficial.barangayId ?? "",
                sitio: editingOfficial.sitio,
                position: editingOfficial.position ?? "SK_CHAIRPERSON",
                skFederationOfficer: editingOfficial.skFederationOfficer,
                skFederationPosition: editingOfficial.skFederationPosition,
                dateElected: editingOfficial.dateElected?.slice(0, 10) ?? "",
                termEnd: editingOfficial.termEnd?.slice(0, 10) ?? null,
                email: editingOfficial.email ?? "",
              }}
              onSubmit={saveOfficial}
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
        <h3 className="text-lg font-semibold text-foreground">Search & Filters</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Search</label>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
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
              <option value="">All municipalities</option>
              {municipalities.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Admission Status</label>
            <select
              value={admissionFilter}
              onChange={(event) => setAdmissionFilter(event.target.value as "" | AdmissionStatus)}
              className="mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40"
            >
              <option value="">All statuses</option>
              {Object.values(AdmissionStatus).map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void fetchOfficials(0)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setMunicipalityFilter("");
              setAdmissionFilter("");
              void fetchOfficials(0);
            }}
            className="rounded-lg border border-glass-border bg-surface-elevated/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Loading officials...</p>
        ) : officials.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No official records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-surface-elevated text-left text-xs uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-5 py-4">Full Name</th>
                  <th className="px-5 py-4">Position</th>
                  <th className="px-5 py-4">Municipality</th>
                  <th className="px-5 py-4">Barangay</th>
                  <th className="px-5 py-4">Date Elected</th>
                  <th className="px-5 py-4">Term End</th>
                  <th className="px-5 py-4">Admission</th>
                  <th className="px-5 py-4">Status</th>
                  {isAdmin ? <th className="px-5 py-4">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-foreground">
                {officials.map((official) => (
                  <tr key={official.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {formatOfficialFullName(official)}
                      </p>
                      <p className="text-xs text-muted">{official.email ?? "No email"}</p>
                    </td>
                    <td className="px-5 py-4">{formatEnumLabel(official.position)}</td>
                    <td className="px-5 py-4 text-muted">{official.municipality ?? "N/A"}</td>
                    <td className="px-5 py-4 text-muted">
                      {official.barangay ?? "N/A"}
                      {official.sitio ? (
                        <span className="block text-xs">Sitio {official.sitio}</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-muted">{formatDate(official.dateElected)}</td>
                    <td className="px-5 py-4 text-muted">{formatDate(official.termEnd)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          official.admissionStatus === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : official.admissionStatus === "PENDING"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {official.admissionStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          official.status === "ACTIVE"
                            ? "bg-accent/20 text-accent"
                            : "bg-surface-elevated/80 text-muted"
                        }`}
                      >
                        {official.status}
                      </span>
                    </td>
                    {isAdmin ? (
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingOfficial(official)}
                            className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={savingOfficialId === official.id}
                            onClick={() =>
                              void setOfficialStatus(
                                official,
                                official.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              )
                            }
                            className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70 disabled:opacity-60"
                          >
                            {official.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && totalCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalCount)} of{" "}
            {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchOfficials(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <span className="rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-muted">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => void fetchOfficials(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
