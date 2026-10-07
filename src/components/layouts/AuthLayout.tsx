"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, House, Landmark, LockKeyhole, ShieldCheck } from "lucide-react";

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
      <div className={styles.shell}>
        <aside className={styles.brandPanel} aria-label="SKTECH governance platform">
          <div className={styles.panelPattern} aria-hidden="true" />
          <div className={styles.brandTop}>
            <Link href="/" className={styles.brand} aria-label="SKTECH home"><span className={styles.brandMark}><Landmark size={22} aria-hidden="true" /></span><span>SK<span className={styles.brandAccent}>TECH</span><small>ORIENTAL MINDORO</small></span></Link>
            <div className={styles.wordmark}><Image src="/assets/branding/oriental-mindoro-wordmark.png" alt="Oriental Mindoro" width={900} height={327} priority /></div>
          </div>
          <div className={styles.hero}>
            <span className={styles.roleBadge}><ShieldCheck size={15} aria-hidden="true" />{roleBadge}</span>
            <h2>{illustrationTitle}</h2>
            <p className={styles.intro}>{illustrationSubtitle}</p>
            {showIllustrationLogo ? <div className={styles.landscape} aria-hidden="true"><span className={styles.landscapeSun} /><span className={styles.landscapeRidge} /><span className={styles.landscapeWave} /><span className={styles.landscapeCaption}>A connected future for youth governance</span></div> : null}
            {highlights.length ? <ul className={styles.highlights}>{highlights.map((item) => <li key={item}><span><Check size={15} aria-hidden="true" /></span>{item}</li>)}</ul> : null}
          </div>
          <div className={styles.brandBottom}><p className={styles.privacyNote}><LockKeyhole size={16} aria-hidden="true" />{privacyNote}</p><p className={styles.disclaimer}>SKTECH is a capstone prototype. Not a government-issued system.</p></div>
        </aside>
        <div className={styles.formPanel}>
          <header className={styles.formHeader}><span className={styles.formHeaderLabel}>SECURE PORTAL ACCESS</span><div className={styles.headerActions}><ThemeToggle quiet /><Link href="/" className={styles.homeLink}><House size={16} aria-hidden="true" /><span>Home</span></Link></div></header>
          <div className={styles.formColumn}>
          <section id="auth-panel" tabIndex={-1} className={`${styles.card} ${cardClassName}`} aria-labelledby="auth-title">
            <div className={styles.cardAccent} aria-hidden="true"><span /><span /><span /></div>
            <div className={styles.cardIcon}><LockKeyhole size={20} aria-hidden="true" /></div>
            <p className={styles.cardEyebrow}>{roleBadge} <ArrowUpRight size={13} aria-hidden="true" /></p>
            <h1 id="auth-title">{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            <div className={styles.formContent}>{children}</div>
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </section>
          </div>
          <p className={styles.formFootnote}>Protected access · SKTECH Oriental Mindoro</p>
        </div>
      </div>
    </main>
  );
}
