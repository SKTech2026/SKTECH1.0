"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function JoinForm({ code }: { code: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(step === "register" ? "/api/kk/otp" : "/api/kk/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step === "register" ? { code, firstName, lastName, email, password } : { code, email, otp }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      if (step === "register") { setStep("verify"); setMessage("Check your email for the six-digit code. It expires in five minutes."); return; }
      const login = await signIn("credentials", { redirect: false, role: "KK_MEMBER", userId: email.trim().toLowerCase(), password, callbackUrl: "/dashboard/kk-member" });
      if (!login || login.error) { setMessage("Email verified. Sign in to continue."); router.push("/kk/login"); return; }
      router.push(login.url ?? "/dashboard/kk-member"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); }
    finally { setBusy(false); }
  }

  const input = "mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground";
  return <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
    {step === "register" ? <>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">First name<input className={input} value={firstName} onChange={e => setFirstName(e.target.value)} required maxLength={100} autoComplete="given-name" /></label><label className="text-sm font-medium">Last name<input className={input} value={lastName} onChange={e => setLastName(e.target.value)} required maxLength={100} autoComplete="family-name" /></label></div>
      <label className="block text-sm font-medium">Email<input className={input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
      <label className="block text-sm font-medium">Password (at least 10 characters)<input className={input} type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={10} maxLength={128} required autoComplete="new-password" /></label>
      <p className="text-xs text-muted">Your account is created only after the code sent to this email is verified.</p>
    </> : <>
      <p className="text-sm text-muted">Enter the code sent to {email}. Never share your code with anyone.</p>
      <label className="block text-sm font-medium">Six-digit code<input className={input} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required autoComplete="one-time-code" /></label>
      <button type="button" className="text-sm underline" onClick={() => { setStep("register"); setOtp(""); }}>Request a new code</button>
    </>}
    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : step === "register" ? "Send verification code" : "Verify and continue"}</button>
  </form>;
}
