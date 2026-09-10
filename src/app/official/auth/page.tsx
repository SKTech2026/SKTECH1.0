"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthLayout from "@/components/layouts/AuthLayout";

export default function OfficialAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      title="SKTECH Official Portal"
      subtitle="Secure access for SK Officials"
      illustrationTitle="Integrated E-Governance Platform"
      illustrationSubtitle="Digital ID • Attendance • Announcements • SK Services"
      cardClassName="max-w-[500px]"
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

      <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
        <span className="h-1.5 w-8 rounded-full bg-[#1452d9]" />
        <span className="h-1.5 w-4 rounded-full bg-[#cf2638]" />
        <span className="h-1.5 w-4 rounded-full bg-[#f3c72b]" />
        Secure official access
      </div>

      <form onSubmit={onPasswordSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-700">User Account</label>
          <p className="mt-1 text-xs text-slate-500">Use the Gmail/email address you registered with.</p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="registered email address"
            autoComplete="username"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1452d9] focus:ring-4 focus:ring-[#1452d9]/10"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-[#1452d9] hover:text-[#0f43b5]">
              Forgot Password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1452d9] focus:ring-4 focus:ring-[#1452d9]/10"
          />
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className="w-full rounded-xl bg-[#1452d9] px-4 py-3 text-sm font-bold text-white shadow-[0_16px_30px_-18px_#1452d9] transition hover:bg-[#0f43b5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {passwordLoading ? "Signing in..." : "Sign in to Official Portal"}
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-[#f3c72b]/40 bg-[#fff9df] px-4 py-3 text-xs leading-5 text-slate-600">
        Need access? Register as an SK Official and wait for Staff/Admin approval before using dashboard services.
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/official/auth/register"
          className="font-semibold text-[#1452d9] hover:text-[#0f43b5]"
        >
          Register as an SK Official
        </Link>
      </p>

      <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
        SKTECH is a capstone project prototype system and not an official government-issued system.
      </p>

    </AuthLayout>
  );
}
