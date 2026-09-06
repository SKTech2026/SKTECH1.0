"use client";

import { useTheme, type ThemeName } from "@/context/ThemeContext";

export default function AppearanceSelector() {
  const { theme, setTheme } = useTheme();
  const options: { id: ThemeName; label: string }[] = [
    { id: "system", label: "System" },
    { id: "minimal-light", label: "Light" },
    { id: "government-dark", label: "Dark" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Appearance mode">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setTheme(option.id)}
          aria-pressed={theme === option.id}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            theme === option.id
              ? "border-accent bg-accent/15 text-accent"
              : "border-glass-border bg-surface-elevated/60 text-foreground hover:bg-surface-elevated"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
