"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
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

export default function OfficialAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
            mode: "LOGIN",
            email,
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
      const normalizedEmail = email.trim().toLowerCase();
      router.push(
        `/official/auth/verify?mode=LOGIN&email=${encodeURIComponent(normalizedEmail)}&cooldown=${payload.cooldownSeconds ?? 60}`,
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

  const onPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await signIn("credentials", {
        redirect: false,
        officialEmail: normalizedEmail,
        officialPassword: password,
        callbackUrl: "/dashboard/official",
      });

      if (!response || response.error) {
        throw new Error("Invalid email or password.");
      }

      router.push(response.url ?? "/dashboard/official");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to login using password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Official Login"
      subtitle="Sign in with email + password, or request OTP when needed."
      illustrationTitle="SKTech Official Portal"
      illustrationSubtitle="Provincial-grade authentication for SK officials with clean and secure OTP access."
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

      <form onSubmit={onPasswordSubmit} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Official Gmail Address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@gmail.com"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {passwordLoading ? "Signing in..." : "Login with Email + Password"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={onOtpSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Use OTP instead</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@gmail.com"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending Code..." : "Send OTP Code"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/official/auth/register"
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          Create one
        </Link>
      </p>

    </AuthLayout>
  );
}
