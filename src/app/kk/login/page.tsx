"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function KKLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await signIn("credentials", { redirect: false, role: "KK_MEMBER", userId: email.trim().toLowerCase(), password, callbackUrl: "/dashboard/kk-member" });
    if (!result || result.error) { setError("Invalid credentials or email not verified."); setBusy(false); return; }
    router.push(result.url ?? "/dashboard/kk-member"); router.refresh();
  }
  return <main className="mx-auto max-w-md px-5 py-20"><div className="rounded-3xl border border-border bg-surface p-8 shadow-lg"><p className="text-sm font-bold uppercase tracking-widest text-accent">SKTECH KK Portal</p><h1 className="mt-3 text-3xl font-bold">Member sign in</h1><form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm">Verified email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3" /></label><label className="block text-sm">Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button></form><p className="mt-6 text-sm text-muted">New member? Ask your barangay SK Chairperson for an invitation link.</p><Link href="/" className="mt-3 inline-block text-sm underline">Back to home</Link></div></main>;
}
