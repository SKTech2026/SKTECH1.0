"use client";

import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import AuthLayout from "@/components/layouts/AuthLayout";
import AuthRoleNav from "@/components/auth/AuthRoleNav";
import PasswordInput from "@/components/auth/PasswordInput";
import type { CredentialRole } from "@/components/LoginCard";

function formatAuthError(errorCode: string | null): string | null {
  if (!errorCode) return null;
  if (errorCode === "use_credentials") {
    return "This account must sign in using employee ID and password.";
  }
  if (errorCode === "official_pending") {
    return "Your OFFICIAL account is pending staff approval.";
  }
  if (errorCode === "account_not_approved") {
    return "Your account is not approved for dashboard access.";
  }
  if (errorCode === "not_registered") {
    return "No official pre-registration found. Please register first.";
  }
  if (errorCode === "CredentialsSignin") {
    return "Invalid user ID or password.";
  }
  if (errorCode === "OAuthAccountNotLinked") {
    return "Google sign-in is disabled for OFFICIAL. Use Official OTP login.";
  }
  if (errorCode === "Configuration") {
    return "Authentication is not configured in deployment yet. Check Vercel environment variables.";
  }
  if (errorCode === "DatabaseUnavailable") {
    return "Cannot connect to the database. Check DATABASE_URL, then run npm run -s seed.";
  }
  return "Unable to sign in. Please try again.";
}

function normalizeCredentialUserId(role: CredentialRole, userId: string) {
  const trimmed = userId.trim();

  if (role !== "ADMIN") {
    return trimmed;
  }

  return trimmed.replace(/^admin[oO](\d{2})$/i, "admin0$1");
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rolePrefill = searchParams.get("role")?.toUpperCase();
  const loginRole: CredentialRole = rolePrefill === "ADMIN" ? "ADMIN" : "STAFF";
  const isAdminView = loginRole === "ADMIN";

  const callbackUrl = useMemo(
    () =>
      searchParams.get("callbackUrl") ??
      (isAdminView ? "/dashboard/admin" : "/dashboard/staff"),
    [searchParams, isAdminView],
  );

  const [adminUserId, setAdminUserId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [staffUserId, setStaffUserId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [submittingRole, setSubmittingRole] = useState<CredentialRole | null>(null);
  const [formError, setFormError] = useState<string | null>(
    formatAuthError(searchParams.get("error")),
  );

  const userId = isAdminView ? adminUserId : staffUserId;
  const password = isAdminView ? adminPassword : staffPassword;

  const submitCredentials = async (
    event: FormEvent<HTMLFormElement>,
    role: CredentialRole,
    credentialUserId: string,
    credentialPassword: string,
  ) => {
    event.preventDefault();
    setFormError(null);
    setSubmittingRole(role);

    const normalizedUserId = normalizeCredentialUserId(role, credentialUserId);

    const response = await signIn("credentials", {
      redirect: false,
      userId: normalizedUserId,
      password: credentialPassword,
      role,
      callbackUrl,
    });

    setSubmittingRole(null);

    if (!response || response.error) {
      const authError = formatAuthError(response?.error ?? null);
      if (authError) {
        setFormError(authError);
        return;
      }

      setFormError("Invalid user ID or password for this access panel.");
      return;
    }

    router.push(response.url ?? callbackUrl);
    router.refresh();
  };

  return (
    <AuthLayout
      title="SKTECH Internal Portal"
      subtitle="Administrative and municipal operations access."
      portal="internal"
      roleBadge="Admin & Staff"
      illustrationTitle="Provincial operations, secured in one platform."
      illustrationSubtitle="Manage Oriental Mindoro youth governance through the access assigned to your role."
      highlights={["Provincial monitoring", "Staff access and admissions", "Compliance and analytics"]}
      privacyNote="Use only your assigned employee account. Activity is limited to your authorized role."
      footer={<div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-xs font-semibold text-blue-800"><Link href="/official/auth" className="hover:underline">Official Portal</Link><Link href="/kk/login" className="hover:underline">KK Member Portal</Link></div>}
    >
      <AuthRoleNav activeRole={loginRole} />
      {formError ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </p>
      ) : null}

      <form
        onSubmit={(event) =>
          submitCredentials(event, loginRole, userId, password)
        }
        className="space-y-3"
        aria-busy={submittingRole !== null}
      >
        <label htmlFor="credential-user-id" className="block text-sm font-semibold text-slate-700">User ID</label>
        <input
          id="credential-user-id"
          value={userId}
          onChange={(event) =>
            isAdminView
              ? setAdminUserId(event.target.value)
              : setStaffUserId(event.target.value)
          }
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          placeholder="Enter your user ID"
          autoComplete="username"
          required
        />
        <label htmlFor="credential-password" className="block pt-2 text-sm font-semibold text-slate-700">Password</label>
        <PasswordInput
          id="credential-password"
          value={password}
          onChange={(event) =>
            isAdminView
              ? setAdminPassword(event.target.value)
              : setStaffPassword(event.target.value)
          }
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={submittingRole !== null}
          className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submittingRole ? "Signing in..." : `Sign in as ${isAdminView ? "Admin" : "Staff"}`}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f5f9]" />}>
      <LoginContent />
    </Suspense>
  );
}
