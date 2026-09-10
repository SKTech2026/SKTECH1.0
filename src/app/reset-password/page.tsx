"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import AuthLayout from "@/components/layouts/AuthLayout";

const SUCCESS_MESSAGE = "Password updated successfully. You may now sign in.";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "This reset link is invalid or expired.");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError("This reset link is invalid or expired.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to reset password right now.");
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new password for your SKTECH Official account."
      illustrationTitle="Secure Account Recovery"
      illustrationSubtitle="Reset access safely using a one-time link sent to your registered User Account."
      cardClassName="max-w-[500px]"
    >
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {SUCCESS_MESSAGE}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="new-password">New Password</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            disabled={!token || success || loading}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1452d9] focus:ring-4 focus:ring-[#1452d9]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            disabled={!token || success || loading}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1452d9] focus:ring-4 focus:ring-[#1452d9]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Re-enter your password"
          />
        </div>
        <button
          type="submit"
          disabled={!token || success || loading}
          className="w-full rounded-xl bg-[#1452d9] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f43b5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <Link href="/official/auth" className="mt-5 inline-block text-xs font-semibold text-[#1452d9] hover:text-[#0f43b5]">
        Back to Official Login
      </Link>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout
          title="Reset Password"
          subtitle="Create a new password for your SKTECH Official account."
          illustrationTitle="Secure Account Recovery"
          illustrationSubtitle="Loading reset details..."
        >
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Preparing reset form...</p>
        </AuthLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
