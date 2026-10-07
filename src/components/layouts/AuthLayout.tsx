"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, House, Landmark, LockKeyhole } from "lucide-react";

import ThemeToggle from "@/components/ThemeToggle";
import styles from "./AuthLayout.module.css";

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
  portal?: "official" | "internal" | "kk";
  roleBadge?: string;
  highlights?: string[];
  privacyNote?: string;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  illustrationTitle = "SKTECH Governance Portal",
  illustrationSubtitle = "Secure digital access for Oriental Mindoro youth governance.",
  cardClassName = "max-w-[460px]",
  showIllustrationLogo = true,
  portal = "internal",
  roleBadge = "Secure access",
  highlights = [],
  privacyNote = "Your account is protected by role-based access controls.",
}: AuthLayoutProps) {
  return (
    <main className={styles.root} data-portal={portal}>
      <a href="#auth-panel" className={styles.skipLink}>Skip to form</a>
      <div className={styles.background} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="SKTECH home">
          <span className={styles.brandMark}><Landmark size={22} aria-hidden="true" /></span>
          <span>SK<span className={styles.brandAccent}>TECH</span></span>
        </Link>
        <div className={styles.wordmark}>
          <Image src="/assets/branding/oriental-mindoro-wordmark.png" alt="Oriental Mindoro" width={900} height={327} priority />
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link href="/" className={styles.homeLink}><House size={16} aria-hidden="true" /><span>Back to home</span></Link>
        </div>
      </header>
      <div className={styles.layout}>
        <aside className={styles.hero} aria-label="SKTECH governance platform">
          <span className={styles.roleBadge}><LockKeyhole size={15} aria-hidden="true" />{roleBadge}</span>
          <h2>{illustrationTitle}</h2>
          <p className={styles.intro}>{illustrationSubtitle}</p>
          {showIllustrationLogo ? <div className={styles.portalPreview} aria-hidden="true"><span className={styles.previewMark}><Landmark size={22} /></span><span><strong>SKTECH</strong><small>{roleBadge}</small></span><span className={styles.previewStatus}>Protected portal</span></div> : null}
          {highlights.length ? <ul className={styles.highlights}>{highlights.map((item) => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul> : null}
          <p className={styles.privacyNote}><LockKeyhole size={16} aria-hidden="true" />{privacyNote}</p>
        </aside>
        <div className={styles.formColumn}>
          <section id="auth-panel" tabIndex={-1} className={`${styles.card} ${cardClassName}`} aria-labelledby="auth-title">
            <div className={styles.cardAccent} aria-hidden="true"><span /><span /><span /></div>
            <h1 id="auth-title">{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            <div className={styles.formContent}>{children}</div>
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </section>
        </div>
      </div>
      <footer className={styles.pageFooter}>SKTECH is a capstone prototype. It is not a government-issued system.</footer>
    </main>
  );
}
