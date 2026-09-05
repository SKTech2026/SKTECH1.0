"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, LogOut } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";

type MobileTopBarProps = {
  title?: string;
};

export default function MobileTopBar({ title = "SKTech Mobile" }: MobileTopBarProps) {
  const pathname = usePathname();
  const logoutCallbackUrl = pathname.startsWith("/mobile/official")
    ? "/official/auth"
    : pathname.startsWith("/mobile/staff-scanner")
      ? "/login?role=STAFF"
      : "/login";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-glass-border bg-surface/85 px-3 py-2.5 text-foreground backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Link
          href="/mobile"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/70 text-foreground transition hover:border-accent/60 hover:bg-surface-elevated"
          aria-label="Go to landing page"
        >
          <Home className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-accent">SKTech</p>
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle className="h-8" />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: logoutCallbackUrl })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/70 text-foreground transition hover:border-rose-300/60 hover:bg-surface-elevated"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
