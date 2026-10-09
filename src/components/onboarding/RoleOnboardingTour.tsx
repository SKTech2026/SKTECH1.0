"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { DashboardRole } from "@/lib/assistant/sktech-help";
import { onboardingStorageKey, roleTours } from "@/lib/onboarding/role-tours";

const sessionCompleted = new Set<string>();

export default function RoleOnboardingTour({ role }: { role: DashboardRole }) {
  const { language, t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  const key = onboardingStorageKey(role);
  const steps = roleTours[role];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let completed = sessionCompleted.has(key);
      try {
        completed ||= window.localStorage.getItem(key) === "complete";
      } catch {
        // Storage may be disabled; keep completion for this page session.
      }
      setReady(true);
      setOpen(!completed);
      setStepIndex(0);
    });
    return () => cancelAnimationFrame(frame);
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        complete();
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  // complete is deliberately bound to the current role key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  function complete() {
    sessionCompleted.add(key);
    try {
      window.localStorage.setItem(key, "complete");
    } catch {
      // The in-memory marker prevents repeats while storage is unavailable.
    }
    setOpen(false);
    restartRef.current?.focus();
  }

  if (!ready) return null;

  return (
    <>
      {!open && (
        <button ref={restartRef} type="button" onClick={() => { setStepIndex(0); setOpen(true); }}
          className="fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] left-4 z-40 inline-flex min-h-10 items-center gap-2 rounded-full border border-glass-border bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-lg hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <HelpCircle className="h-4 w-4" aria-hidden="true" /> {t("Restart tour")}
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 pb-[calc(1rem_+_env(safe-area-inset-bottom))] sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-description"
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-glass-border bg-surface p-5 text-foreground shadow-2xl outline-none motion-safe:animate-in sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">{t("Step")} {stepIndex + 1} {t("of")} {steps.length}</p>
              <button type="button" onClick={complete} aria-label={t("Skip onboarding tour")} className="rounded-lg p-2 text-muted hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X className="h-5 w-5" /></button>
            </div>
            <h2 id="onboarding-title" className="mt-5 text-xl font-bold">{t(steps[stepIndex].title)}</h2>
            <p id="onboarding-description" className="mt-3 text-sm leading-6 text-muted">{t(steps[stepIndex].body)}</p>
            <div className="mt-6 flex gap-1.5" aria-hidden="true">{steps.map((step, index) => <span key={step.title} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-accent" : "bg-glass-border"}`} />)}</div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={complete} className="min-h-11 rounded-lg px-3 text-sm font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t("Skip tour")}</button>
              <div className="flex gap-2">
                {stepIndex > 0 && <button type="button" onClick={() => setStepIndex((index) => index - 1)} className="min-h-11 rounded-lg border border-glass-border px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{language === "en" ? "Back" : "Bumalik"}</button>}
                <button type="button" onClick={stepIndex === steps.length - 1 ? complete : () => setStepIndex((index) => index + 1)} className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{t(stepIndex === steps.length - 1 ? "Finish" : "Next")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
