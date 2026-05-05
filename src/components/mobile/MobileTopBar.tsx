"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Home, LogOut } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";

type MobileTopBarProps = {
  title?: string;
};

export default function MobileTopBar({ title = "SKTech Mobile" }: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/15 bg-slate-950/75 px-3 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-slate-900/70 text-slate-100 transition hover:border-cyan-300/60 hover:bg-slate-800/80"
          aria-label="Go to landing page"
        >
          <Home className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">SKTech</p>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle className="h-8" />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-slate-900/70 text-slate-100 transition hover:border-rose-300/60 hover:bg-slate-800/80"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
