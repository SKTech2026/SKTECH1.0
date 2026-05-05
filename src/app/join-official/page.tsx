"use client";

import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";
import { OfficialRole } from "@prisma/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import AuthLayout from "@/components/layouts/AuthLayout";

type JoinResponse = {
  message?: string;
  error?: string;
};

const formatJoinError = (errorCode: string | null): string | null => {
  if (!errorCode) return null;
  if (errorCode === "not_registered") {
    return "No pre-registration found for this account. Submit the form below first.";
  }
  return "Unable to complete request.";
};

function JoinOfficialContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [address, setAddress] = useState("");
  const [officialRole, setOfficialRole] = useState<OfficialRole>(OfficialRole.OTHER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(formatJoinError(searchParams.get("error")));
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pendingMessage = useMemo(() => {
    if (statusParam !== "pending") return null;
    return "Your account is pending staff approval. You can update your details below.";
  }, [statusParam]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/official-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          middleName: middleName || undefined,
          email,
          contactNo: contactNo || undefined,
          address: address || undefined,
          officialRole,
        }),
      });

      const payload = (await response.json()) as JoinResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to submit registration.");
      }

      setSuccessMessage(
        payload.message ?? "Registration submitted successfully. Please wait for staff approval.",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to submit registration.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join as Official"
      subtitle="Submit your pre-registration details. Your account will be marked pending until approved."
      illustrationTitle="Official Onboarding"
      illustrationSubtitle="Structured onboarding for SK officials before role activation."
      cardClassName="max-w-3xl"
    >
      {pendingMessage ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {pendingMessage}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">First Name</label>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Last Name</label>
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Middle Name (Optional)</label>
          <input
            value={middleName}
            onChange={(event) => setMiddleName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Contact Number (Optional)</label>
          <input
            value={contactNo}
            onChange={(event) => setContactNo(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Official Position</label>
          <select
            value={officialRole}
            onChange={(event) => setOfficialRole(event.target.value as OfficialRole)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {Object.values(OfficialRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Address (Optional)</label>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function JoinOfficialPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
      <JoinOfficialContent />
    </Suspense>
  );
}
