"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import PasswordInput from "@/components/auth/PasswordInput";
import AuthLayout from "@/components/layouts/AuthLayout";

export default function KKLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", { redirect: false, role: "KK_MEMBER", userId: email.trim().toLowerCase(), password, callbackUrl: "/dashboard/kk-member" });
    if (!result || result.error) {
      setError("Invalid credentials or email not verified.");
      setBusy(false);
      return;
    }
    router.push(result.url ?? "/dashboard/kk-member");
    router.refresh();
  }

  return <AuthLayout
    title="KK Member Portal"
    subtitle="Access your KK profile, YouthPass, and certificates."
    portal="kk"
    roleBadge="Katipunan ng Kabataan"
    illustrationTitle="Your youth profile, in one place."
    illustrationSubtitle="Stay connected to your barangay and access the services linked to your verified membership."
    highlights={["Complete your KK profile", "View your YouthPass", "Access earned certificates"]}
    privacyNote="Only verified members can sign in. Public verification shows limited, public-safe details."
    footer={<div className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600"><p><Link href="/kk#invitation" className="font-semibold text-teal-800 hover:underline">I have an invite link / Join through invitation</Link></p><p><Link href="/kk#verification" className="font-semibold text-teal-800 hover:underline">Verify YouthPass or Certificate</Link></p></div>}
  >
    {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      <div><label htmlFor="kk-email" className="text-sm font-semibold text-slate-800">Verified email</label><input id="kk-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your verified email" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none motion-safe:transition-colors motion-safe:duration-200 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/15" /></div>
      <div><label htmlFor="kk-password" className="text-sm font-semibold text-slate-800">Password</label><PasswordInput id="kk-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></div>
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-teal-800 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Signing in..." : "Sign in to KK Portal"}</button>
    </form>
    <p className="mt-5 text-xs leading-5 text-slate-600">New member? Open the invitation link sent by your barangay SK Chairperson to register and verify your email.</p>
  </AuthLayout>;
}
