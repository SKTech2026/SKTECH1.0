"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "sktech.pwa-install-dismissed";

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(DISMISSED_KEY) === "1"; } catch { /* Storage can be unavailable. */ }
    if (standalone || dismissed) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* Keep dismissal for this page. */ }
    setInstallEvent(null);
  };

  const install = async () => {
    const event = installEvent;
    setInstallEvent(null);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "dismissed") dismiss();
    } catch {
      dismiss();
    }
  };

  return (
    <aside aria-label="Install SKTECH App" className="fixed inset-x-4 top-[calc(1rem_+_env(safe-area-inset-top))] z-[60] mx-auto max-w-sm rounded-2xl border border-cyan-300/40 bg-slate-950/95 p-4 text-white shadow-[0_20px_55px_-20px_rgba(6,19,45,0.9)] backdrop-blur-xl sm:left-auto sm:right-5 sm:mx-0">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-500/20 text-cyan-200"><Download className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install SKTECH App</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Open SKTECH from your home screen for a more app-like experience.</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss install prompt" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void install()} className="min-h-11 flex-1 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Install</button>
        <button type="button" onClick={dismiss} className="min-h-11 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Not now</button>
      </div>
    </aside>
  );
}
