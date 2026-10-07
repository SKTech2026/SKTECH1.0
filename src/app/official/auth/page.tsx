"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthLayout from "@/components/layouts/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";

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
      title="SK Official Portal"
      subtitle="Secure access for SK officials and barangay youth governance."
      portal="official"
      roleBadge="SK Official Access"
      illustrationTitle="Your barangay governance workspace."
      illustrationSubtitle="Sign in to your official profile and the tools available to your role."
      highlights={["Official identity and profile", "Attendance and municipal updates", "Barangay KK tools for authorized chairpersons"]}
      privacyNote="Official records remain inside your authorized workspace. Use your registered email to continue."
      footer={<div className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600"><p>For Admin or Staff access, use the <Link href="/login?role=STAFF" className="font-semibold text-blue-800 hover:underline">Internal Portal</Link>.</p><p>KK member? <Link href="/kk/login" className="font-semibold text-blue-800 hover:underline">Open the KK Member Portal</Link>.</p></div>}
    >
      {error ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <form onSubmit={onPasswordSubmit} className="space-y-4" aria-busy={passwordLoading}>
        <div>
          <label htmlFor="official-email" className="text-sm font-semibold text-slate-700">Email</label>
          <input
            id="official-email"
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
            <label htmlFor="official-password" className="text-sm font-semibold text-slate-700">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-[#1452d9] hover:text-[#0f43b5]">
              Forgot Password?
            </Link>
          </div>
          <PasswordInput
            id="official-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
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

      <p className="mt-4 text-sm text-slate-600">
        New here?{" "}
        <Link
          href="/official/auth/register"
          className="font-semibold text-[#1452d9] hover:text-[#0f43b5]"
        >
          Register as an SK Official
        </Link>
      </p>

    </AuthLayout>
  );
}
