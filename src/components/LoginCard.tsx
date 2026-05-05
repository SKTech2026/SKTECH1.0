"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

export type CredentialRole = "ADMIN" | "STAFF";

type LoginCardProps = {
  isAdminView: boolean;
  isDarkTheme: boolean;
  formError: string | null;
  submittingRole: CredentialRole | null;
  adminUserId: string;
  adminPassword: string;
  staffUserId: string;
  staffPassword: string;
  onAdminUserIdChange: (value: string) => void;
  onAdminPasswordChange: (value: string) => void;
  onStaffUserIdChange: (value: string) => void;
  onStaffPasswordChange: (value: string) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    role: CredentialRole,
    userId: string,
    password: string,
  ) => Promise<void>;
};

export default function LoginCard({
  isAdminView,
  isDarkTheme,
  formError,
  submittingRole,
  adminUserId,
  adminPassword,
  staffUserId,
  staffPassword,
  onAdminUserIdChange,
  onAdminPasswordChange,
  onStaffUserIdChange,
  onStaffPasswordChange,
  onSubmit,
}: LoginCardProps) {
  const userId = isAdminView ? adminUserId : staffUserId;
  const password = isAdminView ? adminPassword : staffPassword;

  return (
    <section
      className={`w-full max-w-xl rounded-3xl border p-6 transition-all duration-500 sm:p-8 ${
        isDarkTheme
          ? "border-cyan-300/20 bg-slate-900/70 shadow-[0_20px_60px_-20px_rgba(56,189,248,0.35)] backdrop-blur-xl"
          : "border-slate-200 bg-white shadow-[0_20px_45px_-24px_rgba(15,23,42,0.35)]"
      }`}
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/sk-tech-logo.png"
            alt="SKTech logo"
            width={56}
            height={56}
            className="h-12 w-12 object-contain"
            priority
          />
          <div>
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                isDarkTheme ? "text-cyan-300" : "text-blue-700"
              }`}
            >
              SK Provincial Federation
            </p>
            <h1
              className={`text-3xl font-bold tracking-tight ${
                isDarkTheme ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {isAdminView ? "Admin Login" : "Staff Login"}
            </h1>
            <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>
              {isAdminView
                ? "Administrator credential portal."
                : "Municipal staff credential portal."}
            </p>
          </div>
        </div>

        {isAdminView ? (
          <Link
            href="/login?role=STAFF"
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              isDarkTheme
                ? "border-cyan-300/30 text-slate-100 hover:bg-slate-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            STAFF
          </Link>
        ) : (
          <Link
            href="/login?role=ADMIN"
            className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              isDarkTheme
                ? "bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            ADMIN
          </Link>
        )}
      </header>

      {formError ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            isDarkTheme
              ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {formError}
        </p>
      ) : null}

      <form
        onSubmit={(event) =>
          onSubmit(
            event,
            isAdminView ? "ADMIN" : "STAFF",
            userId,
            password,
          )
        }
        className={`mt-4 rounded-2xl border p-4 ${
          isDarkTheme
            ? "border-cyan-300/20 bg-slate-950/65"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <label
          className={`block text-xs font-medium ${
            isDarkTheme ? "text-slate-300" : "text-slate-700"
          }`}
        >
          User ID
        </label>
        <input
          value={userId}
          onChange={(event) =>
            isAdminView
              ? onAdminUserIdChange(event.target.value)
              : onStaffUserIdChange(event.target.value)
          }
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
            isDarkTheme
              ? "border-cyan-300/20 bg-slate-900 text-slate-100 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30"
              : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          }`}
          placeholder={isAdminView ? "admin001" : "staff001"}
          autoComplete="username"
          required
        />
        <label
          className={`mt-3 block text-xs font-medium ${
            isDarkTheme ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) =>
            isAdminView
              ? onAdminPasswordChange(event.target.value)
              : onStaffPasswordChange(event.target.value)
          }
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
            isDarkTheme
              ? "border-cyan-300/20 bg-slate-900 text-slate-100 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30"
              : "border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          }`}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={submittingRole !== null}
          className="mt-4 w-full rounded-md bg-[#b03333] px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:shadow-[0_0_16px_rgba(176,51,51,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submittingRole
            ? "Signing in..."
            : isAdminView
              ? "Login as Admin"
              : "Login as Staff"}
        </button>
      </form>

      {!isAdminView ? (
        <p className={`mt-3 text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
          SK Official login is on a separate page.{" "}
          <Link
            href="/official/auth"
            className={`font-semibold ${isDarkTheme ? "text-cyan-300" : "text-blue-700"}`}
          >
            Go to Official Login
          </Link>
        </p>
      ) : null}

      <div className="mt-3">
        <Link
          href="/forgot-password"
          className={`text-xs transition ${
            isDarkTheme
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Forgot password?
        </Link>
      </div>
    </section>
  );
}

