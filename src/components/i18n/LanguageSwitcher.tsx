"use client";

import { Globe2 } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground">
      {!compact && <span className="whitespace-nowrap">{t("Language")}</span>}
      <div role="group" aria-label={t("Language")} className="inline-flex h-10 items-center gap-0.5 rounded-full border border-glass-border bg-surface-elevated/80 p-1 shadow-sm">
        {!compact && <Globe2 className="ml-1 h-3.5 w-3.5 text-accent" aria-hidden="true" />}
        {(["en", "fil"] as const).map((option) => (
          <button key={option} type="button" onClick={() => setLanguage(option)}
            aria-label={option === "en" ? "English" : "Filipino"} aria-pressed={language === option}
            className={`min-h-8 min-w-9 rounded-full px-1.5 text-[11px] font-bold motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${language === option ? "bg-accent text-white shadow-sm" : "text-muted hover:bg-surface hover:text-foreground"}`}>
            {option === "en" ? "EN" : "FIL"}
          </button>
        ))}
      </div>
    </div>
  );
}
