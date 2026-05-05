"use client";

import { signOut } from "next-auth/react";
import { LogOut, UserCircle2 } from "lucide-react";

import ThemeSelector from "@/components/dashboard/theme-selector";

type SettingsPanelProps = {
  roleLabel: string;
  account: {
    name: string | null | undefined;
    email: string | null | undefined;
    employeeId?: string | null | undefined;
    status: string;
  };
};

export default function SettingsPanel({ roleLabel, account }: SettingsPanelProps) {
  return (
    <div className="space-y-6">
      <section className="glass-card-elevated rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          Dashboard Settings
        </p>
        <h2 className="mt-3 text-3xl font-bold text-[color:var(--color-foreground)]">
          Preferences & Account
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-muted)]">
          Configure appearance and review account details for your {roleLabel} workspace.
        </p>
      </section>

      <section className="glass-card rounded-3xl p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
          Theme Selection
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Choose a visual preset. Theme changes apply instantly and persist on this browser.
        </p>
        <div className="mt-4">
          <ThemeSelector />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr,0.75fr]">
        <article className="glass-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
            Account Information
          </h3>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                Full Name
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.name ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                Role
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {roleLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                Email
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.email ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                Employee ID
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.employeeId ?? "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                Account Status
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.status}
              </dd>
            </div>
          </dl>
        </article>

        <article className="glass-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
            Profile Preview
          </h3>
          <div className="mt-4 rounded-2xl border border-[color:var(--color-glass-border)] bg-[color:var(--color-surface-elevated)] p-4">
            <div className="flex items-center gap-3">
              <UserCircle2 className="h-11 w-11 text-[color:var(--color-accent)]" />
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-foreground)]">
                  {account.name ?? "Unnamed User"}
                </p>
                <p className="text-xs text-[color:var(--color-muted)]">
                  {account.email ?? "No email"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[color:var(--color-muted)]">
              Changes to profile metadata are controlled by authentication and user management policies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/25"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </article>
      </section>
    </div>
  );
}
