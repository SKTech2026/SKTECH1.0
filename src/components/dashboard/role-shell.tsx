"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  ScanLine,
  Settings2,
  ShieldCheck,
  Trophy,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";

import Logo from "@/components/ui/Logo";

export type IconName =
  | "activity"
  | "badgeCheck"
  | "barChart3"
  | "calendarDays"
  | "clipboardList"
  | "layoutDashboard"
  | "megaphone"
  | "messageSquare"
  | "scanLine"
  | "settings"
  | "shieldCheck"
  | "trophy"
  | "userCheck"
  | "userCog"
  | "users";

const ICONS: Record<IconName, LucideIcon> = {
  activity: Activity,
  badgeCheck: BadgeCheck,
  barChart3: BarChart3,
  calendarDays: CalendarDays,
  clipboardList: ClipboardList,
  layoutDashboard: LayoutDashboard,
  megaphone: Megaphone,
  messageSquare: MessageSquare,
  scanLine: ScanLine,
  settings: Settings2,
  shieldCheck: ShieldCheck,
  trophy: Trophy,
  userCheck: UserCheck,
  userCog: UserCog,
  users: Users,
};

export type RoleShellItem = {
  href: string;
  label: string;
  description: string;
  icon: IconName;
};

type RoleShellProps = {
  roleLabel: string;
  heading: string;
  subheading: string;
  items: RoleShellItem[];
  logoutCallbackUrl?: string;
  children: ReactNode;
};

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export default function RoleShell({
  roleLabel,
  heading,
  subheading,
  items,
  logoutCallbackUrl = "/login",
  children,
}: RoleShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,var(--color-gradient-start),var(--color-gradient-end))] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--color-accent)_24%,transparent),_transparent_45%)]" />
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8 lg:py-8">
        <aside className="hidden w-[320px] shrink-0 rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md lg:flex lg:flex-col">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Logo size="md" theme="dark" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  SKTECH
                </p>
                <p className="text-xs tracking-wide text-muted">Provincial Federation</p>
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              SKTech Command
            </p>
            <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground">
              {heading}
            </h1>
            <p className="mt-2 text-sm text-muted">{subheading}</p>
          </div>

          <div className="mt-6 inline-flex w-fit rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
            {roleLabel}
          </div>

          <nav className="mt-6 space-y-2">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group block rounded-2xl border px-4 py-3 transition ${
                    active
                      ? "border-accent/40 bg-accent/15 shadow-lg shadow-[0_16px_32px_-18px_var(--color-ring)]"
                      : "border-glass-border bg-surface/40 hover:border-glass-border hover:bg-surface-elevated/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-lg p-2 ${
                        active
                          ? "bg-accent/20 text-accent"
                          : "bg-surface-elevated text-muted group-hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: logoutCallbackUrl })}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface/45 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated/70 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md lg:hidden">
            <div className="mb-4 flex items-center justify-center">
              <Logo size="sm" theme="dark" className="logo-fade-in" />
            </div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    {roleLabel}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: logoutCallbackUrl })}
                className="inline-flex items-center gap-1 rounded-lg border border-glass-border bg-surface/45 px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-glass-border bg-surface/45 text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
