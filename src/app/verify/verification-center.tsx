"use client";

import { ArrowRight, BadgeCheck, FileBadge2, IdCard, LockKeyhole, QrCode, SearchCheck, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { verificationTarget, type VerificationType } from "@/lib/verification-target";

const options = [
  { id: "official", title: "Official Digital ID", description: "Check an issued SK Official credential.", Icon: IdCard },
  { id: "youthpass", title: "KK YouthPass", description: "Confirm a member's public YouthPass status.", Icon: BadgeCheck },
  { id: "certificate", title: "Digital Certificate", description: "Check an issued KK certificate record.", Icon: FileBadge2 },
] as const;

export default function VerificationCenter() {
  const router = useRouter();
  const [type, setType] = useState<VerificationType>("official");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = verificationTarget(input, type);
    if (!target) {
      setError("Please enter a valid SKTECH verification link or code.");
      return;
    }
    setError("");
    router.push(target);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f7ff] text-[#10254a] [color-scheme:light]">
      <header className="border-b border-[#d8e5f8] bg-white/95 px-4 py-3 shadow-[0_12px_28px_-25px_#0b2e68] sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="SKTECH home">
            <Image src="/icons/icon-192.png" alt="" width={58} height={58} className="h-10 w-10 object-contain sm:h-12 sm:w-12" priority />
            <span className="min-w-0 text-sm font-black tracking-[0.04em] sm:text-base">SKTECH <span className="block text-[10px] font-semibold tracking-wide text-[#657b9e] sm:text-xs">PUBLIC SERVICES</span></span>
          </Link>
          <Link href="/kk" className="rounded-full border border-[#cadbf5] px-3.5 py-2 text-xs font-bold text-[#1553af] transition-colors hover:bg-[#eff5ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#97bafa] sm:px-5 sm:text-sm">KK Portal</Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#09234b] px-4 pb-24 pt-16 text-white sm:px-6 sm:pb-28 sm:pt-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,#1a5aaa70,transparent_38%),linear-gradient(125deg,#071a3a,#113769)]" />
        <div className="pointer-events-none absolute -right-24 top-8 -z-10 h-80 w-80 rounded-full border border-white/10 sm:right-8" />
        <div className="pointer-events-none absolute -right-8 top-16 -z-10 h-60 w-60 rounded-full border border-white/10 sm:right-20" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="motion-safe:animate-[verify-rise_550ms_ease-out_both]">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-200/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-100"><ShieldCheck className="h-4 w-4 text-[#f6d168]" /> Public credential check</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">SKTECH <span className="text-[#9bc8ff]">Verification Center</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#d8e7fb] sm:text-lg">Verify official SKTECH digital credentials, YouthPass records, and certificates using a QR link or verification code.</p>
            <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-sky-100 sm:text-sm"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#f6d168]" /> Issued records</span><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[#f6d168]" /> Public-safe results</span></div>
          </div>
          <div className="mx-auto hidden w-full max-w-sm rounded-[30px] border border-white/20 bg-white/10 p-7 shadow-[0_30px_90px_-35px_#0008] backdrop-blur-sm motion-safe:animate-[verify-rise_700ms_ease-out_both] lg:block" aria-hidden="true">
            <div className="rounded-2xl border border-white/15 bg-[#061935]/70 p-7 text-center"><QrCode className="mx-auto h-28 w-28 text-white" strokeWidth={1.25} /><div className="mx-auto mt-5 h-1.5 w-32 rounded-full bg-[#f6d168]" /><p className="mt-5 text-sm font-bold tracking-[0.14em] text-sky-100">SCAN · CHECK · CONFIRM</p></div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[#123b77]"><SearchCheck className="h-6 w-6" /><span className="text-sm font-bold">Public verification ready</span><BadgeCheck className="ml-auto h-5 w-5 text-emerald-600" /></div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto -mt-12 max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20" aria-labelledby="verify-form-heading">
        <div className="grid gap-7 rounded-[28px] border border-[#dbe6f7] bg-white p-5 shadow-[0_28px_70px_-42px_#102d65] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d5ab5]">Choose a credential</p>
            <h2 id="verify-form-heading" className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">What would you like to verify?</h2>
            <p className="mt-3 text-sm leading-6 text-[#5c6f8d]">Scan the QR code on the issued record, or paste its verification link or record ID here.</p>
            <div className="mt-6 grid gap-3" role="group" aria-label="Credential type">
              {options.map(({ id, title, description, Icon }) => (
                <button key={id} type="button" onClick={() => { setType(id); setError(""); }} aria-pressed={type === id} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9ac0f5] ${type === id ? "border-[#2e6bc9] bg-[#edf5ff] shadow-[inset_3px_0_0_#1d5ab5]" : "border-[#dbe6f7] bg-white hover:bg-[#f7faff]"}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e1edff] text-[#1553af]"><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0"><span className="block font-bold">{title}</span><span className="mt-0.5 block text-xs leading-5 text-[#5c6f8d]">{description}</span></span>
                  {type === id && <BadgeCheck className="ml-auto h-5 w-5 shrink-0 text-[#1d5ab5]" />}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={submit} className="flex flex-col justify-center rounded-3xl border border-[#dbe6f7] bg-[#f8fbff] p-5 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#123c78] text-white"><SearchCheck className="h-6 w-6" /></span>
            <h3 className="mt-5 text-xl font-black sm:text-2xl">Enter verification details</h3>
            <p className="mt-2 text-sm leading-6 text-[#5c6f8d]">Use the full SKTECH QR link, a public verification path, or the record ID printed on the credential.</p>
            <label htmlFor="verification-input" className="mt-7 text-sm font-bold">Verification link or record ID</label>
            <input id="verification-input" value={input} onChange={(event) => { setInput(event.target.value); if (error) setError(""); }} autoComplete="off" spellCheck={false} placeholder="Paste a link or enter a record ID" className="mt-2 w-full min-w-0 rounded-xl border border-[#bfcee5] bg-white px-4 py-3.5 text-sm text-[#10254a] shadow-sm outline-none placeholder:text-[#8292a9] focus:border-[#2260bd] focus:ring-4 focus:ring-[#b8d3fa]" aria-invalid={Boolean(error)} aria-describedby={error ? "verification-error" : "verification-hint"} />
            {error ? <p id="verification-error" role="alert" className="mt-2 text-sm font-medium text-[#b42332]">{error}</p> : <p id="verification-hint" className="mt-2 text-xs leading-5 text-[#687b98]">Example: /id/record-id or a QR verification URL</p>}
            <button type="submit" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1452b1] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-18px_#1452b1] transition-colors hover:bg-[#0d3e89] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9ac0f5]">Verify record <ArrowRight className="h-4 w-4" /></button>
            <p className="mt-5 border-t border-[#dbe6f7] pt-5 text-xs leading-5 text-[#657894]">Verification opens the existing public result page. No account sign-in or private profile lookup is performed here.</p>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6" aria-labelledby="safety-heading">
        <div className="grid gap-5 rounded-[28px] bg-[#e8f1ff] p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-start"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#1553af]"><LockKeyhole className="h-6 w-6" /></span><div><h2 id="safety-heading" className="text-lg font-black">Public information only</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#4e6382]">Verification pages show only public-safe information. Private contact details, birthdates, and sensitive records are not displayed. Match the result with the credential being presented before accepting it.</p></div></div>
      </section>

      <footer className="bg-[#081c3e] px-4 py-10 text-white sm:px-6"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black tracking-wide">SKTECH Verification Center</p><p className="mt-1 text-xs text-sky-100/75">Public checks for issued SKTECH credentials.</p></div><div className="flex flex-wrap gap-3"><Link href="/" className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">Go to SKTECH</Link><Link href="/kk" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#103775] hover:bg-sky-100">Open KK Portal</Link></div></div></footer>
      <style>{`@keyframes verify-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </main>
  );
}
