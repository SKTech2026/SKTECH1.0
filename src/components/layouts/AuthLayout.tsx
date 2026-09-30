"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Fingerprint, HeartHandshake, House, Landmark, ShieldCheck, Sparkles, Users } from "lucide-react";

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
  illustrationTitle = "Your community. Connected.",
  illustrationSubtitle = "A shared digital space for youth leadership and public service.",
  cardClassName = "max-w-[460px]",
  showIllustrationLogo = true,
}: AuthLayoutProps) {
  return (
    <main className={styles.root}>
      <a href="#auth-panel" className={styles.skipLink}>Skip to form</a>
      <div className={styles.background} aria-hidden="true"><span /><span /></div>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="SKTECH home">
          <span className={styles.brandMark}><Landmark size={24} aria-hidden="true" /></span>
          <span>SK<span className={styles.brandAccent}>TECH</span><small>GOVERNANCE, REIMAGINED.</small></span>
        </Link>
        <div className={styles.wordmark}><span>ORIENTAL</span><strong>MINDORO<span aria-hidden="true">.</span></strong></div>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link href="/" className={styles.homeLink}><House size={16} aria-hidden="true" /><span>Back to home</span></Link>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.hero} aria-label="SKTECH youth governance platform">
          <div className={styles.eyebrow}><span /> THE NEXT GENERATION OF PUBLIC SERVICE</div>
          <h2>Youth-led today.{" "}<br />A brighter <span>Mindoro</span><br /> tomorrow.</h2>
          <p className={styles.intro}>Integrated E-Governance and Emerging Technology Platform for SK Councils.</p>
          {showIllustrationLogo ? (
            <div className={styles.scene} aria-hidden="true">
              <div className={styles.orbit} /><div className={styles.orbitInner} />
              <div className={styles.connection} />
              <div className={styles.core}><Landmark size={42} strokeWidth={1.3} /><strong>SKTECH</strong><span>CONNECTED GOVERNANCE</span></div>
              <div className={`${styles.floatCard} ${styles.youth}`}><span className={styles.goldIcon}><Users size={21} /></span><div><strong>Youth leadership</strong><small>Ideas into impact</small></div></div>
              <div className={`${styles.floatCard} ${styles.service}`}><span className={styles.blueIcon}><HeartHandshake size={21} /></span><div><strong>Public service</strong><small>People at the heart</small></div></div>
              <div className={`${styles.floatCard} ${styles.transparency}`}><span className={styles.greenIcon}><ShieldCheck size={21} /></span><div><strong>Transparency</strong><small>Progress you can see</small></div></div>
              <span className={styles.spark}><Sparkles size={20} /></span>
              <span className={styles.redDot} /><span className={styles.goldDot} />
            </div>
          ) : null}
          <div className={styles.heroFoot}><span className={styles.footNumber}>01 /</span><div><strong>{illustrationTitle}</strong><p>{illustrationSubtitle}</p></div><ArrowUpRight size={22} aria-hidden="true" /></div>
        </aside>

        <div className={styles.formColumn}>
          <section id="auth-panel" tabIndex={-1} className={`${styles.card} ${cardClassName}`} aria-labelledby="auth-title">
            <div className={styles.cardAccent} aria-hidden="true"><span /><span /><span /></div>
            <div className={styles.cardEyebrow}><Fingerprint size={18} aria-hidden="true" /> YOUR SKTECH WORKSPACE</div>
            <h1 id="auth-title">{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            <div className={styles.formContent}>{children}</div>
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </section>
          <p className={styles.formCaption}><ShieldCheck size={14} aria-hidden="true" /> Built for leadership. Designed for connection.</p>
        </div>
      </div>
      <footer className={styles.pageFooter}><span>SANGGUNIANG KABATAAN · ORIENTAL MINDORO</span><span>Youth. Service. Innovation.</span></footer>
    </main>
  );
}
