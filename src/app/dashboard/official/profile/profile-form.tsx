"use client";

import { OfficialPosition } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { toTermEndDate } from "@/lib/sk-official";

type MunicipalityOption = {
  id: string;
  name: string;
  province: string;
  barangays: {
    id: string;
    name: string;
  }[];
};

type InitialProfile = {
  officialId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  position: OfficialPosition;
  municipalityId: string;
  barangayId: string;
  dateElected: string;
  termEnd: string;
  contactNo: string;
  address: string;
  photoUrl: string;
};

type ProfileFormProps = {
  initial: InitialProfile;
  municipalities: MunicipalityOption[];
};

const POSITION_OPTIONS: { value: OfficialPosition; label: string }[] = [
  { value: "SK_CHAIRPERSON", label: "SK Chairperson" },
  { value: "SK_SECRETARY", label: "SK Secretary" },
  { value: "SK_TREASURER", label: "SK Treasurer" },
  { value: "SK_COUNCILOR", label: "SK Councilor" },
];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40";

type ApiResponse = {
  error?: string;
  message?: string;
  data?: {
    photoUrl?: string | null;
  };
};

const DEFAULT_PHOTO_URL = "/images/default-official.svg";

export default function OfficialProfileForm({ initial, municipalities }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [middleName, setMiddleName] = useState(initial.middleName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [position, setPosition] = useState<OfficialPosition>(initial.position);
  const [municipalityId, setMunicipalityId] = useState(initial.municipalityId);
  const [barangayId, setBarangayId] = useState(initial.barangayId);
  const [dateElected, setDateElected] = useState(initial.dateElected);
  const [termEnd, setTermEnd] = useState(initial.termEnd);
  const [contactNo, setContactNo] = useState(initial.contactNo);
  const [address, setAddress] = useState(initial.address);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [persistedPhotoUrl, setPersistedPhotoUrl] = useState(initial.photoUrl);
  const [photoPreview, setPhotoPreview] = useState(initial.photoUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedMunicipality = useMemo(
    () => municipalities.find((entry) => entry.id === municipalityId) ?? null,
    [municipalityId, municipalities],
  );

  const barangayOptions = useMemo(() => {
    if (!selectedMunicipality) return [];
    return selectedMunicipality.barangays.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedMunicipality]);

  const handleMunicipalityChange = (value: string) => {
    setMunicipalityId(value);
    setBarangayId("");
  };

  const handleDateElectedChange = (value: string) => {
    setDateElected(value);
    setTermEnd(toTermEndDate(value));
  };

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (!file) {
      setPhotoPreview(persistedPhotoUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.set("firstName", firstName.trim());
      payload.set("middleName", middleName.trim());
      payload.set("lastName", lastName.trim());
      payload.set("position", position);
      payload.set("municipalityId", municipalityId);
      payload.set("barangayId", barangayId);
      payload.set("dateElected", dateElected);
      payload.set("termEnd", termEnd);
      payload.set("contactNo", contactNo.trim());
      payload.set("address", address.trim());
      if (photoFile) {
        payload.set("photo", photoFile);
      }

      const response = await fetch("/api/official/profile", {
        method: "PATCH",
        body: payload,
      });

      const body = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to update profile.");
      }

      if (body.data?.photoUrl) {
        setPersistedPhotoUrl(body.data.photoUrl);
        setPhotoPreview(body.data.photoUrl);
        setPhotoFile(null);
      }
      setSuccess(body.message ?? "Profile updated.");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to update profile.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md sm:p-7">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-foreground">Profile Details for Digital ID</h3>
        <p className="mt-1 text-sm text-muted">
          Edit your identity details and photo. Updates reflect on your digital ID card.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-glass-border bg-surface-elevated/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">ID Photo</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-28 w-24 overflow-hidden rounded-lg border border-glass-border bg-surface-elevated/50">
              <Image
                src={photoPreview}
                alt="Official photo preview"
                fill
                className="object-cover"
                sizes="96px"
                onError={() => setPhotoPreview(DEFAULT_PHOTO_URL)}
              />
            </div>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => handlePhotoChange(event.target.files?.[0] ?? null)}
                className="block text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-accent hover:file:bg-accent/30"
              />
              <p className="text-xs text-muted">Supported formats: JPG, PNG, WEBP (max 5MB).</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            First Name
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Middle Name
            <input className={inputClass} value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Last Name
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Position
            <select className={inputClass} value={position} onChange={(e) => setPosition(e.target.value as OfficialPosition)} required>
              {POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Municipality
            <select
              className={inputClass}
              value={municipalityId}
              onChange={(e) => handleMunicipalityChange(e.target.value)}
              required
            >
              <option value="">Select municipality</option>
              {municipalities.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Barangay
            <select
              className={inputClass}
              value={barangayId}
              onChange={(e) => setBarangayId(e.target.value)}
              disabled={!municipalityId}
              required
            >
              <option value="">Select barangay</option>
              {barangayOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Contact Number
            <input className={inputClass} value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Date Elected
            <input
              type="date"
              className={inputClass}
              value={dateElected}
              onChange={(e) => handleDateElectedChange(e.target.value)}
              required
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Term End
            <input
              type="date"
              className={inputClass}
              value={termEnd}
              onChange={(e) => setTermEnd(e.target.value)}
              required
            />
          </label>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Address
          <textarea
            className={`${inputClass} min-h-[88px] resize-y`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Profile"}
          </button>
          <Link
            href={`/id/${initial.officialId}`}
            target="_blank"
            className="rounded-lg border border-glass-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70"
          >
            Open Digital ID
          </Link>
        </div>
      </form>
    </section>
  );
}
