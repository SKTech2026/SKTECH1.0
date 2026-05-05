"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import AuthLayout from "@/components/layouts/AuthLayout";

type VerifyResponse = {
  message?: string;
  error?: string;
  redirectTo?: string;
};

type SendOtpResponse = {
  message?: string;
  error?: string;
  cooldownSeconds?: number;
  retryAfterSeconds?: number;
};

type VerifyMode = "REGISTER" | "LOGIN";

function parseMode(value: string | null): VerifyMode {
  return value === "LOGIN" ? "LOGIN" : "REGISTER";
}

function parseCooldown(value: string | null): number {
  const parsed = Number(value ?? "60");
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 60;
  }
  return Math.floor(parsed);
}

function OfficialOtpVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = useMemo<VerifyMode>(
    () => parseMode(searchParams.get("mode")),
    [searchParams],
  );
  const email = useMemo(
    () => (searchParams.get("email") ?? "").trim().toLowerCase(),
    [searchParams],
  );
  const initialCooldown = useMemo(
    () => parseCooldown(searchParams.get("cooldown")),
    [searchParams],
  );

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCooldown((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "LOGIN") {
        const response = await signIn("credentials", {
          redirect: false,
          officialEmail: email,
          officialOtp: code,
          callbackUrl: "/dashboard/official",
        });

        if (!response || response.error) {
          throw new Error("Invalid or expired OTP code.");
        }

        router.push(response.url ?? "/dashboard/official");
        router.refresh();
        return;
      }

      const response = await fetch("/api/official/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          mode,
          code,
        }),
      });

      const payload = (await response.json()) as VerifyResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to verify code.");
      }

      setSuccess(payload.message ?? "Code verified.");
      setTimeout(() => {
        router.push(payload.redirectTo ?? "/official/auth?registered=1");
      }, 1200);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) {
      return;
    }

    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/official/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email,
        }),
      });

      const payload = (await response.json()) as SendOtpResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to resend OTP.");
      }

      setSuccess(payload.message ?? "Verification code resent.");
      setCooldown(payload.cooldownSeconds ?? 60);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Your Code"
      subtitle={`Enter the 6-digit code sent to ${email || "your email"}.`}
      illustrationTitle="OTP Verification"
      illustrationSubtitle="A final verification step to protect SK official identity and account access."
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

      <form onSubmit={onVerify} className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">6-Digit Verification Code</label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            required
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm tracking-[0.2em] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void onResend()}
          disabled={cooldown > 0 || resending}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Resending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
        </button>
        <Link
          href={mode === "REGISTER" ? "/official/auth/register" : "/official/auth"}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Change details
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function OfficialOtpVerifyPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout
          title="Verify Your Code"
          subtitle="Loading verification details..."
          illustrationTitle="OTP Verification"
          illustrationSubtitle="A final verification step to protect SK official identity and account access."
        >
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Preparing verification session...
          </p>
        </AuthLayout>
      }
    >
      <OfficialOtpVerifyContent />
    </Suspense>
  );
}
