"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
      {!compact ? <span>{t("Language")}</span> : null}
      <select
        aria-label={t("Language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value === "fil" ? "fil" : "en")}
        className={`${compact ? "h-11 w-16" : "h-11 max-w-28"} rounded-lg border border-glass-border bg-surface-elevated px-2 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      >
        <option value="en">{compact ? "EN" : "English"}</option>
        <option value="fil">{compact ? "FIL" : "Filipino"}</option>
      </select>
    </label>
  );
}
