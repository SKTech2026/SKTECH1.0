"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ageGroup, ASSEMBLY_FREQUENCY, CIVIL_STATUS, CLASSIFICATION, EDUCATION, kkAge, NO_ASSEMBLY_REASON, SPECIFIC_NEEDS, WORK_STATUS } from "@/lib/kk-survey";

type Value = string | boolean;
const inputClass = "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground";

export default function ProfileForm({ initial, email, municipality, barangay, editable }: { initial: Record<string, Value>; email: string; municipality: string; barangay: string; editable: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const set = (key: string, value: Value) => setValues(previous => ({ ...previous, [key]: value }));
  const string = (key: string) => String(values[key] ?? "");
  const textField = (key: string, label: string, required = true, type = "text") => <label className="block text-sm font-medium" key={key}>{label}<input className={inputClass} type={type} value={string(key)} onChange={event => set(key, event.target.value)} required={required} maxLength={type === "tel" ? 30 : undefined} /></label>;
  const selectField = (key: string, label: string, options: readonly string[]) => <label className="block text-sm font-medium" key={key}>{label}<select className={inputClass} value={string(key)} onChange={event => set(key, event.target.value)} required><option value="">Select an answer</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
  const yesNo = (key: string, label: string) => <label className="block text-sm font-medium" key={key}>{label}<select className={inputClass} value={string(key)} onChange={event => set(key, event.target.value)} required><option value="">Select an answer</option><option value="true">Yes</option><option value="false">No</option></select></label>;
  const birthdate = string("birthdate");
  const age = /^\d{4}-\d{2}-\d{2}$/.test(birthdate) ? kkAge(new Date(`${birthdate}T00:00:00.000Z`)) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const payload = { ...values, specificNeedsCategory: values.youthClassification === "Youth with Specific Needs" ? values.specificNeedsCategory : "", kkAssemblyAttendanceFrequency: values.attendedKkAssembly === "true" ? values.kkAssemblyAttendanceFrequency : "", noKkAssemblyReason: values.attendedKkAssembly === "false" ? values.noKkAssemblyReason : "", registeredSkVoter: values.registeredSkVoter === "true", registeredNationalVoter: values.registeredNationalVoter === "true", votedLastElection: values.votedLastElection === "true", attendedKkAssembly: values.attendedKkAssembly === "true" };
    try {
      const response = await fetch("/api/kk/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save profile.");
      setSuccess("Profile submitted for barangay verification."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save profile."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-9" aria-busy={busy}>
    <fieldset disabled={!editable || busy} className="space-y-8 disabled:opacity-75">
      <div><h2 className="text-xl font-semibold">Personal details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{textField("lastName", "Last name")}{textField("firstName", "First name")}{textField("middleName", "Middle name", false)}{textField("suffix", "Suffix", false)}{textField("region", "Region")}{textField("province", "Province")}<label className="block text-sm font-medium">City / Municipality<input className={inputClass} value={municipality} readOnly /></label><label className="block text-sm font-medium">Barangay<input className={inputClass} value={barangay} readOnly /></label>{textField("purokZone", "Purok / Zone")}{selectField("sexAssignedAtBirth", "Sex assigned at birth", ["Male", "Female"])}{textField("birthdate", "Birthdate", true, "date")}<div className="text-sm"><span className="font-medium">Age and youth group</span><p className="mt-2 rounded-xl border border-border p-3">{age !== null && Number.isFinite(age) ? `${age} · ${ageGroup(age)}` : "Enter your birthdate"}</p></div><label className="block text-sm font-medium">Verified email<input className={inputClass} value={email} readOnly /></label>{textField("contactNumber", "Contact number", true, "tel")}</div></div>
      <div><h2 className="text-xl font-semibold">Demographics</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{selectField("civilStatus", "Civil status", CIVIL_STATUS)}{selectField("educationalBackground", "Educational background", EDUCATION)}{selectField("youthClassification", "Youth classification", CLASSIFICATION)}{string("youthClassification") === "Youth with Specific Needs" && selectField("specificNeedsCategory", "Specific needs category", SPECIFIC_NEEDS)}{selectField("workStatus", "Work status", WORK_STATUS)}</div></div>
      <div><h2 className="text-xl font-semibold">Voter and KK assembly</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{yesNo("registeredSkVoter", "Registered SK voter?")}{yesNo("registeredNationalVoter", "Registered national voter?")}{yesNo("votedLastElection", "Voted in the last election?")}{yesNo("attendedKkAssembly", "Attended a KK assembly?")}{string("attendedKkAssembly") === "true" && selectField("kkAssemblyAttendanceFrequency", "Attendance frequency", ASSEMBLY_FREQUENCY)}{string("attendedKkAssembly") === "false" && selectField("noKkAssemblyReason", "Reason for non-attendance", NO_ASSEMBLY_REASON)}</div></div>
      <div><h2 className="text-xl font-semibold">Privacy and consent</h2><p className="mt-2 text-sm text-muted">Your answers are used for barangay KK profiling and verification. Aggregate reporting contains counts, not individual responses. Communication consent is optional.</p><div className="mt-4 space-y-3">{([ ["dataPrivacyConsent", "I understand and consent to processing my personal data for this registry."], ["profilingConsent", "I consent to KK profiling and barangay verification."], ["aggregateReportingConsent", "I consent to inclusion in aggregate reporting."], ["communicationConsent", "I agree to receive KK communications."] ] as const).map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm"><input type="checkbox" checked={values[key] === true} onChange={event => set(key, event.target.checked)} required={key === "dataPrivacyConsent" || key === "profilingConsent"} className="mt-1" />{label}</label>)}</div></div>
      {editable && <button disabled={busy} className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit for verification"}</button>}
    </fieldset>
    {!editable && <p className="text-sm text-muted">Your profile is read only at its current review status.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
  </form>;
}
