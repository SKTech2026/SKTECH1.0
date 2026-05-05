"use client";

import { OfficialPosition } from "@prisma/client";
import { useMemo, useState } from "react";

import {
  MunicipalityOption,
  OFFICIAL_POSITION_OPTIONS,
  SKOfficialFormPayload,
  toTermEndDate,
  validateSKOfficialPayload,
} from "@/lib/sk-official";

type SKOfficialFormProps = {
  municipalities: MunicipalityOption[];
  initialValues?: Partial<SKOfficialFormPayload>;
  submitting?: boolean;
  submitLabel?: string;
  includeEmail?: boolean;
  statusLabel?: string | null;
  onSubmit: (payload: SKOfficialFormPayload) => Promise<void> | void;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40";

export default function SKOfficialForm({
  municipalities,
  initialValues,
  submitting = false,
  submitLabel = "Save",
  includeEmail = true,
  statusLabel = null,
  onSubmit,
}: SKOfficialFormProps) {
  const [firstName, setFirstName] = useState(initialValues?.firstName ?? "");
  const [middleName, setMiddleName] = useState(initialValues?.middleName ?? "");
  const [lastName, setLastName] = useState(initialValues?.lastName ?? "");
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate ?? "");
  const [province, setProvince] = useState(initialValues?.province ?? "Oriental Mindoro");
  const [municipalityId, setMunicipalityId] = useState(initialValues?.municipalityId ?? "");
  const [barangayId, setBarangayId] = useState(initialValues?.barangayId ?? "");
  const [position, setPosition] = useState<OfficialPosition>(
    initialValues?.position ?? "SK_CHAIRPERSON",
  );
  const [dateElected, setDateElected] = useState(initialValues?.dateElected ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [contactNo, setContactNo] = useState(initialValues?.contactNo ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [municipalitySearch, setMunicipalitySearch] = useState("");
  const [barangaySearch, setBarangaySearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const termEnd = useMemo(() => toTermEndDate(dateElected), [dateElected]);

  const filteredMunicipalities = useMemo(() => {
    const keyword = municipalitySearch.trim().toLowerCase();
    const scoped = municipalities.filter((entry) =>
      entry.province.toLowerCase().includes(province.trim().toLowerCase()),
    );
    if (!keyword) {
      return scoped;
    }
    return scoped.filter((entry) => entry.name.toLowerCase().includes(keyword));
  }, [municipalitySearch, municipalities, province]);

  const selectedMunicipality = useMemo(
    () => municipalities.find((entry) => entry.id === municipalityId) ?? null,
    [municipalityId, municipalities],
  );

  const filteredBarangays = useMemo(() => {
    if (!selectedMunicipality) {
      return [];
    }
    const keyword = barangaySearch.trim().toLowerCase();
    if (!keyword) {
      return selectedMunicipality.barangays;
    }
    return selectedMunicipality.barangays.filter((entry) =>
      entry.name.toLowerCase().includes(keyword),
    );
  }, [barangaySearch, selectedMunicipality]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: SKOfficialFormPayload = {
      firstName: firstName.trim(),
      middleName: middleName.trim() || null,
      lastName: lastName.trim(),
      birthDate,
      province: province.trim(),
      municipalityId,
      barangayId,
      position,
      dateElected,
      termEnd,
      email: email.trim(),
      contactNo: contactNo.trim() || null,
      address: address.trim() || null,
    };

    const validationError = validateSKOfficialPayload(payload, {
      requireEmail: includeEmail,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    await onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {statusLabel ? (
        <span className="inline-flex rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          Current Status: {statusLabel}
        </span>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">First Name</label>
          <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Middle Name</label>
          <input className={inputClass} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Last Name</label>
          <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Birth Date</label>
          <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Date Elected</label>
          <input
            type="date"
            className={inputClass}
            value={dateElected}
            onChange={(e) => setDateElected(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Term End (Auto)</label>
          <input type="date" className={inputClass} value={termEnd} readOnly disabled />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Province</label>
          <input className={inputClass} value={province} onChange={(e) => setProvince(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Position</label>
          <select
            className={inputClass}
            value={position}
            onChange={(e) => setPosition(e.target.value as OfficialPosition)}
          >
            {OFFICIAL_POSITION_OPTIONS.map((entry) => (
              <option key={entry} value={entry}>
                {entry.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Search Municipality</label>
          <input
            className={inputClass}
            value={municipalitySearch}
            onChange={(e) => setMunicipalitySearch(e.target.value)}
            placeholder="Type municipality..."
          />
          <select
            className={`${inputClass} h-36 overflow-y-auto`}
            size={6}
            value={municipalityId}
            onChange={(e) => {
              setMunicipalityId(e.target.value);
              setBarangayId("");
              setBarangaySearch("");
            }}
          >
            {filteredMunicipalities.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Search Barangay</label>
          <input
            className={inputClass}
            value={barangaySearch}
            onChange={(e) => setBarangaySearch(e.target.value)}
            placeholder={selectedMunicipality ? "Type barangay..." : "Select municipality first"}
            disabled={!selectedMunicipality}
          />
          <select
            className={`${inputClass} h-36 overflow-y-auto`}
            size={6}
            value={barangayId}
            onChange={(e) => setBarangayId(e.target.value)}
            disabled={!selectedMunicipality}
          >
            {filteredBarangays.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {includeEmail ? (
          <div>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        ) : null}
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-muted">Contact Number</label>
          <input className={inputClass} value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.14em] text-muted">Address</label>
        <textarea
          rows={3}
          className={inputClass}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
