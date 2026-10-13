"use client";

import { Eye, KeyRound, Pencil, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FEDERATION_LEVEL_OPTIONS, SKFED_POSITION_OPTIONS } from "@/lib/sk-official-options";

import {
  ASSEMBLY_FREQUENCY,
  CIVIL_STATUS,
  CLASSIFICATION,
  EDUCATION,
  NO_ASSEMBLY_REASON,
  SPECIFIC_NEEDS,
  WORK_STATUS,
} from "@/lib/kk-survey";

type AccountRow = {
  id: string;
  name: string;
  email: string | null;
  accountType: "SK Official" | "KK Member";
  role: "OFFICIAL" | "KK_MEMBER";
  status: string;
  municipality: string;
  barangay: string;
  createdAt: string;
  updatedAt: string;
};

type ProfileValues = Partial<{
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  contactNo: string | null;
  contactNumber: string | null;
  municipalityId: string | null;
  barangayId: string | null;
  position: string | null;
  skFederationOfficer: boolean;
  skFederationLevel: string | null;
  skFederationPosition: string | null;
  region: string | null;
  province: string | null;
  purokZone: string | null;
  sexAssignedAtBirth: string | null;
  birthdate: string | null;
  civilStatus: string | null;
  educationalBackground: string | null;
  youthClassification: string | null;
  specificNeedsCategory: string | null;
  workStatus: string | null;
  registeredSkVoter: boolean | null;
  registeredNationalVoter: boolean | null;
  votedLastElection: boolean | null;
  attendedKkAssembly: boolean | null;
  kkAssemblyAttendanceFrequency: string | null;
  noKkAssemblyReason: string | null;
}>;

type AccountDetails = {
  id: string;
  name: string | null;
  email: string | null;
  role: "OFFICIAL" | "KK_MEMBER";
  status: string;
  createdAt: string;
  updatedAt: string;
  official: ProfileValues | null;
  skOfficialProfile: ProfileValues | null;
  kkProfile: ProfileValues | null;
};

type Municipality = { id: string; name: string };
type Barangay = { id: string; name: string; municipalityId: string };
type ListResponse = {
  summary: {
    totalOfficials: number;
    totalMembers: number;
    pendingOfficials: number;
    pendingKkRegistrations: number;
    recentlyUpdated: number;
  };
  data: AccountRow[];
  total: number;
  page: number;
  pageSize: number;
  municipalities: Municipality[];
  barangays: Barangay[];
};
type Toast = { kind: "success" | "warning" | "error"; message: string };
type FormValues = Record<string, string | boolean>;

const inputClass = "mt-1 block min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500";
const buttonClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50";
const pageSize = 30;

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function profileValues(account: AccountDetails): FormValues {
  const profile = account.role === "KK_MEMBER"
    ? account.kkProfile
    : account.official ?? account.skOfficialProfile;
  if (!profile) return { name: account.name ?? "" };
  const birthdate = profile?.birthdate ? String(profile.birthdate).slice(0, 10) : "";
  return {
    name: account.name ?? "",
    firstName: profile?.firstName ?? "",
    middleName: profile?.middleName ?? "",
    lastName: profile?.lastName ?? "",
    suffix: profile?.suffix ?? "",
    contactNumber: profile?.contactNumber ?? profile?.contactNo ?? "",
    municipalityId: profile?.municipalityId ?? "",
    barangayId: profile?.barangayId ?? "",
    position: profile?.position ?? "",
    skFederationOfficer: profile?.skFederationOfficer ?? false,
    skFederationLevel: profile?.skFederationLevel ?? "MUNICIPAL",
    skFederationPosition: profile?.skFederationPosition ?? "",
    region: profile?.region ?? "",
    purokZone: profile?.purokZone ?? "",
    sexAssignedAtBirth: profile?.sexAssignedAtBirth ?? "",
    birthdate,
    civilStatus: profile?.civilStatus ?? "",
    educationalBackground: profile?.educationalBackground ?? "",
    youthClassification: profile?.youthClassification ?? "",
    specificNeedsCategory: profile?.specificNeedsCategory ?? "",
    workStatus: profile?.workStatus ?? "",
    registeredSkVoter: profile?.registeredSkVoter ?? false,
    registeredNationalVoter: profile?.registeredNationalVoter ?? false,
    votedLastElection: profile?.votedLastElection ?? false,
    attendedKkAssembly: profile?.attendedKkAssembly ?? false,
    kkAssemblyAttendanceFrequency: profile?.kkAssemblyAttendanceFrequency ?? "",
    noKkAssemblyReason: profile?.noKkAssemblyReason ?? "",
  };
}

export default function AccountManagementClient() {
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [municipalityId, setMunicipalityId] = useState("");
  const [barangayId, setBarangayId] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [form, setForm] = useState<FormValues>({});
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AccountRow | null>(null);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: query, type, status, page: String(page) });
      if (municipalityId) params.set("municipalityId", municipalityId);
      if (barangayId) params.set("barangayId", barangayId);
      setLoading(true);
      setError(null);
      void fetch(`/api/admin/account-management?${params}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          const payload = await response.json() as ListResponse | { error?: string };
          if (!response.ok || !("data" in payload)) throw new Error(("error" in payload && payload.error) || "Unable to load accounts.");
          setResult(payload);
        })
        .catch((loadError: unknown) => {
          if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load accounts.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, type, status, municipalityId, barangayId, page, refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openAccount = async (id: string, startEditing: boolean) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/account-management/${id}`, { cache: "no-store" });
      const payload = await response.json() as { account?: AccountDetails; error?: string };
      if (!response.ok || !payload.account) throw new Error(payload.error ?? "Unable to load account details.");
      setDetails(payload.account);
      setForm(profileValues(payload.account));
      setEditing(startEditing);
    } catch (loadError) {
      setToast({ kind: "error", message: loadError instanceof Error ? loadError.message : "Unable to load account details." });
    } finally {
      setBusy(false);
    }
  };

  const updateField = (key: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveAccount = async () => {
    if (!details) return;
    setBusy(true);
    try {
      const payload = { ...form };
      if (details.role === "OFFICIAL") {
        if (!payload.skFederationOfficer) {
          payload.skFederationLevel = "";
          payload.skFederationPosition = "";
        }
        delete payload.region;
        delete payload.purokZone;
        delete payload.sexAssignedAtBirth;
        delete payload.birthdate;
        delete payload.civilStatus;
        delete payload.educationalBackground;
        delete payload.youthClassification;
        delete payload.specificNeedsCategory;
        delete payload.workStatus;
        delete payload.registeredSkVoter;
        delete payload.registeredNationalVoter;
        delete payload.votedLastElection;
        delete payload.attendedKkAssembly;
        delete payload.kkAssemblyAttendanceFrequency;
        delete payload.noKkAssemblyReason;
        if (!details.official) {
          delete payload.contactNumber;
          delete payload.skFederationOfficer;
          delete payload.skFederationLevel;
          delete payload.skFederationPosition;
        }
        if (!details.official?.municipalityId && !details.official?.barangayId && !form.municipalityId && !form.barangayId) {
          delete payload.municipalityId;
          delete payload.barangayId;
        }
      } else {
        delete payload.position;
        delete payload.skFederationOfficer;
        delete payload.skFederationLevel;
        delete payload.skFederationPosition;
      }
      const response = await fetch(`/api/admin/account-management/${details.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string; notificationSent?: boolean };
      if (!response.ok) throw new Error(result.error ?? "Account update failed.");
      setDetails(null);
      setEditing(false);
      setRefresh((value) => value + 1);
      setToast(result.notificationSent
        ? { kind: "success", message: "Account updated and notification email sent." }
        : { kind: "warning", message: "Account updated, but the notification email could not be sent." });
    } catch (saveError) {
      setToast({ kind: "error", message: saveError instanceof Error ? saveError.message : "Account update failed." });
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async (account: AccountRow) => {
    if (!account.email) {
      setToast({ kind: "error", message: "This account has no registered email address." });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/account-management/${account.id}/password-reset`, { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to send reset link.");
      setToast({ kind: "success", message: `Password reset link sent to ${account.email}.` });
    } catch (resetError) {
      setToast({ kind: "error", message: resetError instanceof Error ? resetError.message : "Unable to send reset link." });
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/account-management/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const payload = await response.json() as { error?: string; notificationSent?: boolean };
      if (!response.ok) throw new Error(payload.error ?? "Account deletion failed.");
      setDeleteTarget(null);
      setConfirmation("");
      setRefresh((value) => value + 1);
      setToast(payload.notificationSent || !deleteTarget.email
        ? { kind: "success", message: "Account and related profile data permanently deleted." }
        : { kind: "warning", message: "Account deleted, but the notification email could not be sent." });
    } catch (deleteError) {
      setToast({ kind: "error", message: deleteError instanceof Error ? deleteError.message : "Account deletion failed." });
    } finally {
      setBusy(false);
    }
  };

  const summary = result?.summary;
  const pageCount = Math.max(1, Math.ceil((result?.total ?? 0) / pageSize));
  const filteredBarangays = result?.barangays.filter((item) => !municipalityId || item.municipalityId === municipalityId) ?? [];
  const profile = details?.role === "KK_MEMBER"
    ? details.kkProfile
    : details?.official ?? details?.skOfficialProfile;
  const hasEditableProfile = Boolean(details && (details.role === "KK_MEMBER" ? details.kkProfile : details.official || details.skOfficialProfile));
  const selectedBarangay = typeof form.barangayId === "string" ? form.barangayId : "";
  const selectedMunicipality = typeof form.municipalityId === "string" ? form.municipalityId : "";

  const textField = (key: string, label: string, typeName = "text", required = false) => (
    <label key={key} className="block text-xs font-semibold text-slate-600">
      {label}
      <input
        type={typeName}
        value={String(form[key] ?? "")}
        onChange={(event) => updateField(key, event.target.value)}
        disabled={!editing || busy}
        required={editing && required}
        className={inputClass}
      />
    </label>
  );

  const selectField = (key: string, label: string, choices: readonly string[], labels?: Record<string, string>) => (
    <label key={key} className="block text-xs font-semibold text-slate-600">
      {label}
      <select
        value={String(form[key] ?? "")}
        onChange={(event) => updateField(key, event.target.value)}
        disabled={!editing || busy}
        className={inputClass}
      >
        <option value="">Select</option>
        {choices.map((choice) => <option key={choice} value={choice}>{labels?.[choice] ?? choice.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );

  const booleanField = (key: string, label: string) => (
    <label key={key} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
      <input type="checkbox" checked={Boolean(form[key])} disabled={!editing || busy} onChange={(event) => updateField(key, event.target.checked)} />
      {label}
    </label>
  );

  const rowActions = (account: AccountRow) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={buttonClass} title="View account details" aria-label={`View ${account.name}`} onClick={() => void openAccount(account.id, false)}>
        <Eye size={15} /><span className="hidden lg:inline">View</span>
      </button>
      <button type="button" className={buttonClass} title="Edit account details" aria-label={`Edit ${account.name}`} onClick={() => void openAccount(account.id, true)}>
        <Pencil size={15} /><span className="hidden lg:inline">Edit</span>
      </button>
      <button type="button" className={buttonClass} title="Send password reset link" aria-label={`Send password reset to ${account.email ?? account.name}`} disabled={busy || !account.email} onClick={() => void sendReset(account)}>
        <KeyRound size={15} /><span className="hidden lg:inline">Reset</span>
      </button>
      <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100" title="Permanently delete account" aria-label={`Delete ${account.name}`} onClick={() => { setDeleteTarget(account); setConfirmation(""); }}>
        <Trash2 size={15} /><span className="hidden lg:inline">Delete</span>
      </button>
    </div>
  );

  return (
    <main className="space-y-5 pb-8">
      <header className="flex flex-col gap-2 border-b border-glass-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Identity & Access</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Account Management</h1>
          <p className="mt-1 text-sm text-muted">Manage SK Official and KK Member accounts.</p>
        </div>
        <button type="button" className={buttonClass} onClick={() => setRefresh((value) => value + 1)} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      {summary ? (
        <section aria-label="Account summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ["Total SK Officials", summary.totalOfficials],
            ["Total KK Members", summary.totalMembers],
            ["Pending SK Officials", summary.pendingOfficials],
            ["Pending KK Registrations", summary.pendingKkRegistrations],
            ["Recently Updated", summary.recentlyUpdated],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-glass-border bg-surface px-4 py-3 shadow-sm">
              <p className="text-xs font-medium text-muted">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-4 rounded-xl border border-glass-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="relative block sm:col-span-2 xl:col-span-2">
            <span className="sr-only">Search by name or email</span>
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input className={`${inputClass} pl-9`} type="search" placeholder="Search name or email" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
          </label>
          <label className="block text-xs font-semibold text-slate-600">Account type
            <select className={inputClass} value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
              <option value="ALL">All accounts</option><option value="OFFICIALS">SK Officials</option><option value="KK_MEMBERS">KK Members</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Status
            <select className={inputClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="ALL">All statuses</option><option value="APPROVED">Approved</option><option value="PENDING">Pending</option><option value="ACTIVE">Active</option><option value="INCOMPLETE">Incomplete</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Municipality
            <select className={inputClass} value={municipalityId} onChange={(event) => { setMunicipalityId(event.target.value); setBarangayId(""); setPage(1); }}>
              <option value="">All municipalities</option>{result?.municipalities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Barangay
            <select className={inputClass} value={barangayId} onChange={(event) => { setBarangayId(event.target.value); setPage(1); }}>
              <option value="">All barangays</option>{filteredBarangays.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>

        {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
        <div className="flex items-center justify-between text-sm text-muted">
          <p>{loading ? "Loading accounts..." : `${result?.total ?? 0} matching accounts`}</p>
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-r-transparent" aria-label="Loading" /> : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>{["Name", "Email", "Account type", "Municipality", "Barangay", "Status", "Created", "Last updated", "Actions"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && result?.data.length === 0 ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">No accounts match these filters.</td></tr> : null}
              {result?.data.map((account) => (
                <tr key={account.id} className="align-middle text-slate-700 hover:bg-sky-50/40">
                  <td className="max-w-48 truncate px-3 py-3 font-semibold text-slate-900">{account.name}</td>
                  <td className="max-w-52 truncate px-3 py-3">{account.email ?? "—"}</td>
                  <td className="px-3 py-3">{account.accountType}</td>
                  <td className="px-3 py-3">{account.municipality || "—"}</td>
                  <td className="px-3 py-3">{account.barangay || "—"}</td>
                  <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{account.status.replaceAll("_", " ")}</span></td>
                  <td className="whitespace-nowrap px-3 py-3">{dateLabel(account.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{dateLabel(account.updatedAt)}</td>
                  <td className="px-3 py-3">{rowActions(account)}</td>
                </tr>
              ))}
              {loading && !result ? <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-500">Loading account records…</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">
          {!loading && result?.data.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No accounts match these filters.</p> : null}
          {result?.data.map((account) => (
            <article key={account.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="truncate font-semibold text-slate-900">{account.name}</h2><p className="truncate text-xs text-slate-500">{account.email ?? "No registered email"}</p></div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">{account.status.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{account.accountType} · {[account.barangay, account.municipality].filter(Boolean).join(", ") || "Location unavailable"}</p>
              <p className="mt-1 text-[11px] text-slate-500">Created {dateLabel(account.createdAt)} · Updated {dateLabel(account.updatedAt)}</p>
              <div className="mt-3">{rowActions(account)}</div>
            </article>
          ))}
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 pt-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" className={buttonClass} disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <button type="button" className={buttonClass} disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)}>Next</button>
          </div>
        </footer>
      </section>

      {details ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDetails(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="account-details-title" className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{details.role === "OFFICIAL" ? "SK Official" : "KK Member"}</p><h2 id="account-details-title" className="mt-1 text-xl font-bold text-slate-900">{editing ? "Edit account details" : "Account details"}</h2><p className="mt-1 text-sm text-slate-500">{details.email ?? "No registered email"}</p></div>
              <button type="button" className={buttonClass} aria-label="Close account details" onClick={() => setDetails(null)} disabled={busy}><X size={16} /></button>
            </header>
            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-xs font-semibold text-slate-600">Registered email<input className={inputClass} value={details.email ?? ""} disabled /></label>
                {!hasEditableProfile ? textField("name", "Account name", "text", true) : null}
                {hasEditableProfile ? <>
                  {textField("firstName", "First name", "text", true)}
                  {textField("middleName", "Middle name")}
                  {textField("lastName", "Last name", "text", true)}
                  {textField("suffix", "Suffix")}
                  {textField("contactNumber", "Contact number", "tel")}
                  <label className="block text-xs font-semibold text-slate-600">Municipality
                    <select className={inputClass} value={selectedMunicipality} disabled={!editing || busy} onChange={(event) => { updateField("municipalityId", event.target.value); updateField("barangayId", ""); }}>
                      <option value="">Select municipality</option>{result?.municipalities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Barangay
                    <select className={inputClass} value={selectedBarangay} disabled={!editing || busy || !selectedMunicipality} onChange={(event) => updateField("barangayId", event.target.value)}>
                      <option value="">Select barangay</option>{(result?.barangays.filter((item) => item.municipalityId === selectedMunicipality) ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  {details.role === "OFFICIAL" ? <>
                    {selectField("position", "Position", ["SK_CHAIRPERSON", "SK_SECRETARY", "SK_TREASURER", "SK_COUNCILOR"])}
                    {booleanField("skFederationOfficer", "Federation officer")}
                    {selectField("skFederationLevel", "Federation level", [...FEDERATION_LEVEL_OPTIONS])}
                    {selectField("skFederationPosition", "Federation role", SKFED_POSITION_OPTIONS)}
                  </> : <>
                    {textField("region", "Region")}
                    {textField("purokZone", "Purok / zone")}
                    {selectField("sexAssignedAtBirth", "Sex assigned at birth", ["Male", "Female"])}
                    {textField("birthdate", "Birthdate", "date")}
                    {selectField("civilStatus", "Civil status", CIVIL_STATUS)}
                    {selectField("educationalBackground", "Educational background", EDUCATION)}
                    {selectField("youthClassification", "Youth classification", CLASSIFICATION)}
                    {selectField("specificNeedsCategory", "Specific needs category", SPECIFIC_NEEDS)}
                    {selectField("workStatus", "Work status", WORK_STATUS)}
                    {booleanField("registeredSkVoter", "Registered SK voter")}
                    {booleanField("registeredNationalVoter", "Registered national voter")}
                    {booleanField("votedLastElection", "Voted in last election")}
                    {booleanField("attendedKkAssembly", "Attended KK assembly")}
                    {selectField("kkAssemblyAttendanceFrequency", "KK assembly frequency", ASSEMBLY_FREQUENCY)}
                    {selectField("noKkAssemblyReason", "Reason for not attending", NO_ASSEMBLY_REASON)}
                  </>}
                </> : null}
              </div>
              <p className="text-xs text-slate-500">Account status: {details.status.replaceAll("_", " ")} · Created {dateLabel(details.createdAt)} · Last updated {dateLabel(details.updatedAt)}</p>
              {!editing && profile ? <p className="text-xs text-slate-500">Profile fields are shown read-only until Edit is selected.</p> : null}
            </div>
            <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" className={buttonClass} onClick={() => setDetails(null)} disabled={busy}>Close</button>
              {editing ? <button type="button" className="inline-flex min-h-9 items-center justify-center rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50" onClick={() => void saveAccount()} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button> : <button type="button" className={buttonClass} onClick={() => setEditing(true)} disabled={busy}><Pencil size={14} /> Edit details</button>}
            </footer>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/65 p-3 sm:items-center" role="presentation">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-lg rounded-xl border border-rose-200 bg-white p-5 shadow-2xl sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Permanent account action</p>
            <h2 id="delete-account-title" className="mt-2 text-xl font-bold text-slate-900">Delete {deleteTarget.accountType}?</h2>
            <p className="mt-2 break-words text-sm font-semibold text-slate-800">{deleteTarget.name} · {deleteTarget.email ?? "No registered email"}</p>
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">This will permanently delete this account and related profile data. This action cannot be undone. The email may be reused for future registration.</p>
            <label className="mt-4 block text-xs font-semibold text-slate-700">Type DELETE or the account email to confirm
              <input className={inputClass} autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={buttonClass} onClick={() => { setDeleteTarget(null); setConfirmation(""); }} disabled={busy}>Cancel</button>
              <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void deleteAccount()} disabled={busy || (confirmation !== "DELETE" && confirmation.toLowerCase() !== (deleteTarget.email ?? "").toLowerCase())}><Trash2 size={14} />{busy ? "Deleting…" : "Permanently delete"}</button>
            </div>
          </section>
        </div>
      ) : null}

      {toast ? <div role={toast.kind === "error" ? "alert" : "status"} aria-live="polite" className={`fixed bottom-5 right-5 z-[100] max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-xl ${toast.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : toast.kind === "warning" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-rose-200 bg-rose-50 text-rose-900"}`}>{toast.message}</div> : null}
    </main>
  );
}
