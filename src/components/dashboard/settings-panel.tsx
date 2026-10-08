"use client";

import { LogOut, UserCircle2 } from "lucide-react";

import LogoutConfirmButton from "@/components/auth/LogoutConfirmButton";
import ThemeSelector from "@/components/dashboard/theme-selector";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type SettingsPanelProps = {
  roleLabel: string;
  logoutCallbackUrl?: string;
  account: {
    name: string | null | undefined;
    email: string | null | undefined;
    employeeId?: string | null | undefined;
    status: string;
  };
};

export default function SettingsPanel({
  roleLabel,
  logoutCallbackUrl = "/login",
  account,
}: SettingsPanelProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <section className="glass-card-elevated rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          {t("Dashboard Settings")}
        </p>
        <h2 className="mt-3 text-3xl font-bold text-[color:var(--color-foreground)]">
          {t("Preferences & Account")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--color-muted)]">
          Configure appearance and review account details for your {roleLabel} workspace.
        </p>
      </section>

      <section className="glass-card rounded-3xl p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
          {t("Theme Selection")}
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Choose a visual preset. Theme changes apply instantly and persist on this browser.
        </p>
        <div className="mt-4">
          <ThemeSelector />
        </div>
      </section>

      <section className="glass-card rounded-3xl p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">{t("Language")}</h3>
        <div className="mt-4"><LanguageSwitcher /></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr,0.75fr]">
        <article className="glass-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
            {t("Account Information")}
          </h3>
          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                {t("Full Name")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.name ?? t("Not set")}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                {t("Role")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {roleLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                {t("Email")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.email ?? t("Not set")}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                {t("Employee ID")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.employeeId ?? "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                {t("Account Status")}
              </dt>
              <dd className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">
                {account.status}
              </dd>
            </div>
          </dl>
        </article>

        <article className="glass-card rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
            {t("Profile Preview")}
          </h3>
          <div className="mt-4 rounded-2xl border border-[color:var(--color-glass-border)] bg-[color:var(--color-surface-elevated)] p-4">
            <div className="flex items-center gap-3">
              <UserCircle2 className="h-11 w-11 text-[color:var(--color-accent)]" />
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-foreground)]">
                  {account.name ?? t("Unnamed User")}
                </p>
                <p className="text-xs text-[color:var(--color-muted)]">
                  {account.email ?? t("No email")}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-[color:var(--color-muted)]">
              Changes to profile metadata are controlled by authentication and user management policies.
            </p>
          </div>

          <LogoutConfirmButton
            callbackUrl={logoutCallbackUrl}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-700 px-4 py-2.5 text-sm font-semibold text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut className="h-4 w-4" />
            {t("Logout")}
          </LogoutConfirmButton>
        </article>
      </section>
    </div>
  );
}
