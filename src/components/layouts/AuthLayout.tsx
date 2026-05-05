"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { House } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
import InteractiveLogo from "@/components/ui/InteractiveLogo";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  illustrationTitle?: string;
  illustrationSubtitle?: string;
  cardClassName?: string;
  showIllustrationLogo?: boolean;
  illustrationLogoSize?: "sm" | "md" | "lg";
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  illustrationTitle = "SKTech Access Portal",
  illustrationSubtitle = "Role-based secure access for provincial governance operations.",
  cardClassName = "max-w-[440px]",
  showIllustrationLogo = true,
  illustrationLogoSize = "lg",
}: AuthLayoutProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isDarkTheme = mounted ? resolvedTheme === "dark" : false;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute inset-0 transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDarkTheme
              ? "opacity-0 scale-[1.03] blur-[1.1px] bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.12),transparent_40%),linear-gradient(145deg,#dbe2ec,#c8d4e8)]"
              : "opacity-100 scale-100 blur-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.16),transparent_42%),linear-gradient(145deg,#dbe2ec,#c8d4e8)]"
          }`}
        />
        <div
          className={`absolute inset-0 transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDarkTheme
              ? "opacity-100 scale-100 blur-0 bg-[radial-gradient(circle_at_16%_16%,rgba(56,189,248,0.15),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.14),transparent_40%),linear-gradient(160deg,#060f24,#0b1735)]"
              : "opacity-0 scale-[1.03] blur-[1.1px] bg-[radial-gradient(circle_at_16%_16%,rgba(56,189,248,0.12),transparent_35%),linear-gradient(160deg,#060f24,#0b1735)]"
          }`}
        />
        <div
          className={`absolute inset-0 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isDarkTheme
              ? "opacity-100 bg-[radial-gradient(ellipse_at_center,transparent_34%,rgba(2,6,23,0.62)_100%)]"
              : "opacity-100 bg-[radial-gradient(ellipse_at_center,transparent_34%,rgba(100,116,139,0.22)_100%)]"
          }`}
        />
      </div>
      <section
        className={`auth-fade-in relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1500px] grid-cols-1 overflow-hidden rounded-[26px] border transition-[background-color,border-color,box-shadow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[1.15fr_0.85fr] ${
          isDarkTheme
            ? "border-cyan-300/20 bg-slate-900/70 shadow-[0_28px_90px_-45px_rgba(56,189,248,0.45)]"
            : "border-slate-200 bg-[#eef2f8] shadow-[0_24px_64px_-40px_rgba(15,23,42,0.35)]"
        }`}
      >
        <Link
          href="/"
          aria-label="Go to home page"
          className={`absolute right-3 top-3 z-30 inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-500 ${
            isDarkTheme
              ? "border-cyan-300/35 bg-slate-900/85 text-slate-100 hover:border-cyan-300/50 hover:bg-slate-800"
              : "border-slate-300 bg-white/90 text-slate-700 hover:border-blue-400 hover:bg-white"
          }`}
        >
          <House className="h-3 w-3" />
        </Link>

        <aside
          className={`relative flex flex-col items-center justify-center border-b px-6 py-10 transition-[background-color,border-color] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:border-b-0 lg:border-r lg:px-10 ${
            isDarkTheme
              ? "border-cyan-300/15 bg-[linear-gradient(165deg,#071126,#0f2247)]"
              : "border-slate-200 bg-[#c7d4e8]"
          }`}
        >
          <div className="text-center">
            <p
              className={`text-3xl font-extrabold uppercase tracking-tight sm:text-4xl ${
                isDarkTheme ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {illustrationTitle}
            </p>
            <p
              className={`mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base ${
                isDarkTheme ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {illustrationSubtitle}
            </p>
            {showIllustrationLogo ? (
              <div
                className={`logo-fade-in relative mx-auto mt-8 ${
                  illustrationLogoSize === "sm"
                    ? "max-w-[240px]"
                    : illustrationLogoSize === "md"
                      ? "max-w-[320px]"
                      : "max-w-[560px] lg:max-w-[620px]"
                } w-full`}
              >
                <InteractiveLogo
                  darkMode={isDarkTheme}
                  src="/login-logo.png"
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        </aside>

        <div
          className={`flex items-center justify-center px-5 py-8 transition-[background-color] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-8 lg:px-12 ${
            isDarkTheme ? "bg-slate-950/45" : "bg-[#f3f4f6]"
          }`}
        >
          <section
            className={`auth-slide-up w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-700 ${cardClassName}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
                {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
              </div>
              <ThemeToggle className="shrink-0" />
            </div>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </section>
        </div>
      </section>
    </main>
  );
}
