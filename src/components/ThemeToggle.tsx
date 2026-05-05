"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group relative inline-flex items-center gap-1 overflow-hidden rounded-full border px-1 py-0.5 text-[10px] font-semibold tracking-[0.08em] transition-all duration-500 ${
        isDark
          ? "border-cyan-300/30 bg-slate-900/80 text-slate-100 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
          : "border-slate-300 bg-white/90 text-slate-700 shadow-lg hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.4),0_0_36px_rgba(37,99,235,0.22)]"
      } ${className}`}
    >
      <span
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          isDark
            ? "bg-[linear-gradient(120deg,transparent,rgba(56,189,248,0.18),transparent)] opacity-100"
            : "bg-[linear-gradient(112deg,transparent,rgba(56,189,248,0.28),rgba(37,99,235,0.26),transparent)] opacity-0 group-hover:animate-[electricSweep_700ms_ease-out] group-hover:opacity-100"
        }`}
      />
      <span
        className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-500 ${
          isDark
            ? "bg-cyan-500/15 text-cyan-300"
            : "bg-sky-100 text-sky-700 group-hover:bg-sky-200"
        }`}
      >
        {!isDark ? (
          <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:animate-[electricPulse_850ms_ease-out] group-hover:opacity-100" />
        ) : null}
        {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
      </span>
      <span className="relative z-10 hidden pr-1 sm:inline">{isDark ? "LIGHT" : "DARK"}</span>
    </button>
  );
}
