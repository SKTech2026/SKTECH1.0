"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthLayout from "@/components/layouts/AuthLayout";

type SendOtpResponse = {
  message?: string;
  error?: string;
  retryAfterSeconds?: number;
  cooldownSeconds?: number;
};

const OTP_REQUEST_TIMEOUT_MS = 60000;

async function readOtpResponse(response: Response): Promise<SendOtpResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as SendOtpResponse;
  }

  return { error: await response.text() };
}

export default function OfficialRegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), OTP_REQUEST_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch("/api/official/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "REGISTER",
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
          }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }

      const payload = await readOtpResponse(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send OTP.");
      }

      setSuccess(payload.message ?? "Verification code sent.");
      router.push(
        `/official/auth/verify?mode=REGISTER&email=${encodeURIComponent(email.trim().toLowerCase())}&cooldown=${payload.cooldownSeconds ?? 60}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof DOMException && submitError.name === "AbortError"
          ? "Sending the code took too long. Please try again in a moment."
          : submitError instanceof Error
            ? submitError.message
            : "Failed to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Official Account"
      subtitle="Fill in your details, then verify your Gmail using a one-time code."
      illustrationTitle="Official Registration"
      illustrationSubtitle="Streamlined onboarding for SK officials with secure OTP verification."
    >
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">First Name</label>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Last Name</label>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Gmail Address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@gmail.com"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending Code..." : "Send Code"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/official/auth" className="font-semibold text-blue-600 hover:text-blue-500">
          Back to Official Login
        </Link>
      </p>
    </AuthLayout>
  );
}
