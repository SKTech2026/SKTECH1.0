"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Info, LogOut, Settings, X } from "lucide-react";
import { useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import LogoutConfirmButton from "@/components/auth/LogoutConfirmButton";
import NotificationBell from "@/components/notifications/NotificationBell";

type MobileTopBarProps = {
  title?: string;
  isOfficial?: boolean;
  accountName?: string | null;
  accountEmail?: string | null;
  profileImageUrl?: string | null;
};

export default function MobileTopBar({
  title = "SKTech Mobile",
  isOfficial = false,
  accountName,
  accountEmail,
  profileImageUrl,
}: MobileTopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
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
        {isOfficial ? (
          <>
          <NotificationBell
            chatHref="/mobile/official/chat"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/70 text-foreground transition hover:border-accent/60 hover:bg-surface-elevated"
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-glass-border bg-surface-elevated/70 text-foreground transition hover:border-accent/60 hover:bg-surface-elevated"
              aria-label="Open profile menu"
              aria-expanded={isProfileOpen}
            >
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt="Official profile" width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{(accountName ?? "O").slice(0, 1).toUpperCase()}</span>
              )}
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-glass-border bg-surface p-2 shadow-2xl">
                <div className="border-b border-glass-border px-3 pb-2">
                  <p className="truncate text-sm font-semibold text-foreground">{accountName ?? "Official account"}</p>
                  <p className="truncate text-xs text-muted">{accountEmail ?? ""}</p>
                </div>
                <Link href="/mobile/official/settings" onClick={() => setIsProfileOpen(false)} className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-surface-elevated">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button type="button" onClick={() => setIsAboutOpen(true)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground hover:bg-surface-elevated">
                  <Info className="h-4 w-4" />
                  About SKTECH
                </button>
                <LogoutConfirmButton callbackUrl="/official/auth" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10">
                  <LogOut className="h-4 w-4" />
                  Logout
                </LogoutConfirmButton>
              </div>
            ) : null}
          </div>
          </>
        ) : (
          <LogoutConfirmButton
            callbackUrl={logoutCallbackUrl}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-glass-border bg-surface-elevated/70 text-foreground transition hover:border-rose-300/60 hover:bg-surface-elevated"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </LogoutConfirmButton>
        )}
      </div>

      {isAboutOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/60 p-3 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="About SKTECH">
          <div className="w-full max-w-sm rounded-2xl border border-glass-border bg-surface p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">About SKTECH</h2>
              <button type="button" onClick={() => setIsAboutOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated" aria-label="Close About SKTECH">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">SKTECH – Integrated E-Governance System</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Capstone project digital governance platform for SK operations, admissions, attendance, IDs, and announcements.</p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
