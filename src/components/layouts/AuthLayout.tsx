"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { House, Landmark, Users } from "lucide-react";

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
}: AuthLayoutProps) {
  return (
    <main className={styles.root}>
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
          <h2>{illustrationTitle}</h2>
          <p className={styles.intro}>{illustrationSubtitle}</p>
          {showIllustrationLogo ? (
            <div className={styles.scene} aria-hidden="true">
              <span className={styles.governanceGraphic}><Landmark size={30} strokeWidth={1.3} /></span>
              <span className={styles.youthGraphic}><Users size={24} strokeWidth={1.4} /></span>
            </div>
          ) : null}
          <p className={styles.tagline}>Youth-led today. A brighter Mindoro tomorrow.</p>
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
    </main>
  );
}
