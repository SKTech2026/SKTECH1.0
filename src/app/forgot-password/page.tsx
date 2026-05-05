"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import AuthLayout from "@/components/layouts/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your registered email address to receive password reset instructions."
      illustrationTitle="Account Recovery"
      illustrationSubtitle="Secure password recovery for official, staff, and admin access."
    >
      {submitted ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          If an account exists for this email, recovery instructions will be sent.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Send Recovery Link
        </button>
      </form>

      <Link href="/login" className="mt-4 inline-block text-xs text-slate-500 hover:text-slate-700">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
