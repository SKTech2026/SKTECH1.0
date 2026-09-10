"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import AuthLayout from "@/components/layouts/AuthLayout";

export default function ForgotPasswordPage() {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setSubmitted(false);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to process request right now.");
      setSubmitted(true);
    } catch {
      setError("Unable to process request right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your registered User Account to receive reset instructions."
      illustrationTitle="Official Account Recovery"
      illustrationSubtitle="Secure recovery for SKTECH Official accounts."
      cardClassName="max-w-[500px]"
    >
      {submitted ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          If this account is registered, password reset instructions have been sent.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">User Account</label>
          <p className="mt-1 text-xs text-slate-500">Use the Gmail/email address you registered with.</p>
          <input
            type="email"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            autoComplete="username"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1452d9] focus:ring-4 focus:ring-[#1452d9]/10"
            placeholder="registered email address"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#1452d9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f43b5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Instructions"}
        </button>
      </form>

      <Link href="/official/auth" className="mt-4 inline-block text-xs font-semibold text-[#1452d9] hover:text-[#0f43b5]">
        Back to Official Login
      </Link>
    </AuthLayout>
  );
}
