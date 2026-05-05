"use client";

import { Check } from "lucide-react";

import { type ThemeName, useTheme } from "@/context/ThemeContext";

const THEME_PREVIEW: Record<
  ThemeName,
  { background: string; accent: string; surface: string }
> = {
  "government-dark": {
    background: "from-[#0a1f47] to-[#030817]",
    accent: "bg-blue-500",
    surface: "bg-surface-elevated/70",
  },
  "emerald-authority": {
    background: "from-[#083328] to-[#020f0c]",
    accent: "bg-emerald-500",
    surface: "bg-emerald-900/40",
  },
  "royal-purple": {
    background: "from-[#2a1663] to-[#0e0624]",
    accent: "bg-violet-500",
    surface: "bg-violet-900/40",
  },
  "minimal-light": {
    background: "from-[#e8edf7] to-[#f8fbff]",
    accent: "bg-slate-500",
    surface: "bg-white/90",
  },
  "midnight-elite": {
    background: "from-[#0a132b] to-[#010205]",
    accent: "bg-accent",
    surface: "bg-surface-elevated/75",
  },
};

export default function ThemeSelector() {
  const { theme, setTheme, presets } = useTheme();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {presets.map((preset) => {
        const preview = THEME_PREVIEW[preset.id];
        const active = theme === preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => setTheme(preset.id)}
            className={`rounded-2xl border p-3 text-left transition ${
              active
                ? "border-[color:var(--color-accent)] bg-[color:var(--color-surface-elevated)] shadow-lg"
                : "border-[color:var(--color-glass-border)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-accent)]/70 hover:bg-[color:var(--color-surface-elevated)]"
            }`}
          >
            <div
              className={`relative h-20 overflow-hidden rounded-xl bg-gradient-to-br ${preview.background}`}
            >
              <div
                className={`absolute left-3 top-3 h-3.5 w-3.5 rounded-full ${preview.accent}`}
              />
              <div className={`absolute inset-x-3 bottom-3 h-6 rounded-md ${preview.surface}`} />
              {active ? (
                <span className="absolute right-2 top-2 rounded-full bg-black/35 p-1 text-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-sm font-semibold text-[color:var(--color-foreground)]">
              {preset.name}
            </p>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              {preset.tagline}
            </p>
          </button>
        );
      })}
    </div>
  );
}
