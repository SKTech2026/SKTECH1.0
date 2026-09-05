"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo, useState, type ReactNode } from "react";
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
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Settings2,
  ShieldCheck,
  Trophy,
  UserCheck,
  UserCircle,
  UserCog,
  Users,
  X,
} from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
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
  variant?: "default" | "adminCn";
  account?: {
    name?: string | null;
    email?: string | null;
  };
  children: ReactNode;
};

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const ADMIN_GROUPS = [
  {
    label: "OVERVIEW",
    items: ["System Overview", "Overall Analytics"],
  },
  {
    label: "GOVERNANCE",
    items: ["SK Profiling", "Municipalities", "Staff Admission", "Staff Access"],
  },
  {
    label: "OPERATIONS",
    items: ["Event Management", "ID Production", "ID Scanning"],
  },
  {
    label: "SYSTEM",
    items: ["Settings"],
  },
];

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.split("@")[0] || "Admin";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

export default function RoleShell({
  roleLabel,
  heading,
  subheading,
  items,
  logoutCallbackUrl = "/login",
  variant = "default",
  account,
  children,
}: RoleShellProps) {
  const pathname = usePathname();
  const isAdminCn = variant === "adminCn";
  const [adminCollapsed, setAdminCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const activeItem = useMemo(
    () =>
      items
        .filter((item) => isActivePath(pathname, item.href))
        .sort((a, b) => b.href.length - a.href.length)[0] ?? items[0],
    [items, pathname],
  );

  const adminGroups = useMemo(
    () =>
      ADMIN_GROUPS.map((group) => ({
        ...group,
        items: group.items
          .map((label) => items.find((item) => item.label === label))
          .filter((item): item is RoleShellItem => Boolean(item)),
      })).filter((group) => group.items.length > 0),
    [items],
  );

  if (isAdminCn) {
    const accountName = account?.name ?? "Administrator";
    const accountEmail = account?.email ?? "SKTECH Admin";
    const initials = getInitials(account?.name, account?.email);

    const renderAdminNavItem = (
      item: RoleShellItem,
      options?: { compact?: boolean; onNavigate?: () => void },
    ) => {
      const Icon = ICONS[item.icon];
      const active = isActivePath(pathname, item.href);
      const compact = options?.compact ?? false;

      return (
        <Link
          key={item.href}
          href={item.href}
          title={compact ? item.label : undefined}
          aria-label={compact ? item.label : undefined}
          onClick={options?.onNavigate}
          className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            compact ? "justify-center" : ""
          } ${
            active
              ? "border-accent/30 bg-accent/15 text-accent shadow-[0_14px_32px_-20px_var(--color-ring)]"
              : "border-transparent text-muted hover:border-glass-border hover:bg-surface-elevated/70 hover:text-foreground"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${
              active
                ? "border-accent/30 bg-accent/20 text-accent"
                : "border-glass-border bg-surface-elevated/55 text-muted group-hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          {!compact ? (
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">
                {item.label}
              </span>
              <span className="block truncate text-xs font-normal text-muted">
                {item.description}
              </span>
            </span>
          ) : null}
        </Link>
      );
    };

    const sidebar = (mobile = false) => (
      <aside
        className={`flex h-full flex-col border-r border-glass-border bg-surface/95 shadow-[0_24px_50px_-28px_var(--shadow-color)] backdrop-blur-xl ${
          mobile
            ? "w-[min(290px,calc(100vw-2rem))]"
            : adminCollapsed
              ? "w-[88px]"
              : "w-[282px]"
        } transition-[width] duration-300`}
      >
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-glass-border px-4">
          <Link
            href="/dashboard/admin"
            onClick={mobile ? () => setMobileDrawerOpen(false) : undefined}
            className={`flex min-w-0 items-center gap-3 ${
              adminCollapsed && !mobile ? "justify-center" : ""
            }`}
            title="SKTECH Administration"
          >
            <Logo size="sm" theme="dark" />
            {!adminCollapsed || mobile ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold uppercase tracking-wide text-foreground">
                  SKTECH
                </span>
                <span className="block truncate text-xs text-muted">
                  Administration
                </span>
              </span>
            ) : null}
          </Link>
          {mobile ? (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-glass-border bg-surface-elevated/60 text-muted transition hover:text-foreground lg:hidden"
              aria-label="Close admin navigation"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="border-b border-glass-border px-4 py-4">
          <div
            className={`rounded-xl border border-glass-border bg-surface-elevated/50 p-3 ${
              adminCollapsed && !mobile ? "px-2" : ""
            }`}
          >
            <div
              className={`flex items-center gap-3 ${
                adminCollapsed && !mobile ? "justify-center" : ""
              }`}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xs font-bold text-accent">
                {initials}
              </span>
              {!adminCollapsed || mobile ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {accountName}
                  </p>
                  <p className="truncate text-xs text-muted">{accountEmail}</p>
                </div>
              ) : null}
            </div>
            {!adminCollapsed || mobile ? (
              <p className="mt-3 rounded-lg border border-accent/25 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                {roleLabel}
              </p>
            ) : null}
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-color:color-mix(in_oklab,var(--color-accent)_30%,transparent)_transparent] [scrollbar-width:thin]">
          <div className="space-y-5">
            {adminGroups.map((group) => (
              <div key={group.label}>
                {!adminCollapsed || mobile ? (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {group.items.map((item) =>
                    renderAdminNavItem(item, {
                      compact: adminCollapsed && !mobile,
                      onNavigate: mobile ? () => setMobileDrawerOpen(false) : undefined,
                    }),
                  )}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-glass-border p-3">
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: logoutCallbackUrl })}
            className={`inline-flex w-full items-center gap-3 rounded-xl border border-glass-border bg-surface-elevated/55 px-3 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/35 hover:bg-accent/10 ${
              adminCollapsed && !mobile ? "justify-center" : "justify-start"
            }`}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            {!adminCollapsed || mobile ? "Sign out" : null}
          </button>
        </div>
      </aside>
    );

    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,var(--color-gradient-start),var(--color-gradient-end))] text-foreground">
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-accent)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-accent)_6%,transparent)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative flex min-h-screen">
          <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
            {sidebar(false)}
          </div>

          {mobileDrawerOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation backdrop"
                onClick={() => setMobileDrawerOpen(false)}
                className="absolute inset-0 bg-black/45"
              />
              <div className="absolute inset-y-0 left-0">{sidebar(true)}</div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-glass-border bg-surface/88 backdrop-blur-xl">
              <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(true)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-glass-border bg-surface-elevated/60 text-muted transition hover:text-foreground lg:hidden"
                    aria-label="Open admin navigation"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminCollapsed((current) => !current)}
                    className="hidden h-10 w-10 items-center justify-center rounded-lg border border-glass-border bg-surface-elevated/60 text-muted transition hover:text-foreground lg:inline-flex"
                    aria-label={
                      adminCollapsed ? "Expand admin sidebar" : "Collapse admin sidebar"
                    }
                  >
                    {adminCollapsed ? (
                      <PanelLeftOpen className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                      Provincial Administration
                    </p>
                    <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
                      {activeItem?.label ?? heading}
                    </h1>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <ThemeToggle />
                  <div className="hidden items-center gap-2 rounded-full border border-glass-border bg-surface-elevated/60 px-3 py-1.5 text-xs font-semibold text-muted sm:inline-flex">
                    <UserCircle className="h-4 w-4 text-accent" />
                    Administrator Workspace
                  </div>
                </div>
              </div>
            </header>

            <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
              <div className="mx-auto w-full max-w-[1440px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,var(--color-gradient-start),var(--color-gradient-end))] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--color-accent)_24%,transparent),_transparent_45%)]" />
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8 lg:py-8">
        <aside className="hidden w-[320px] shrink-0 rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md lg:sticky lg:top-8 lg:flex lg:max-h-[calc(100vh-4rem)] lg:flex-col">
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
                      className={`rounded-lg p-2 transition ${
                        active
                          ? "bg-accent/20 text-accent"
                          : "bg-surface-elevated text-muted group-hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.label}
                      </p>
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
                className="inline-flex items-center gap-1 rounded-lg border border-glass-border bg-surface/45 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated/70"
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
