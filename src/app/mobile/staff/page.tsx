import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { CalendarDays, MessageSquare, Megaphone, QrCode, ScanFace } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

const options = [
  ["QR Attendance", "Scan official IDs for attendance.", "/mobile/staff/qr-attendance", QrCode],
  ["Face Recognition Attendance", "Run the secure face scanner when needed.", "/mobile/staff-scanner", ScanFace],
  ["Event Management", "Create and manage municipality events.", "/mobile/staff/events", CalendarDays],
  ["Chat Feature", "Message your municipality contacts.", "/mobile/staff/chat", MessageSquare],
  ["Post Announcements / Pubmats", "Publish a text announcement to your municipality feed.", "/mobile/staff/announcements", Megaphone],
] as const;

export default async function MobileStaffPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.STAFF]);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-surface p-5 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <p className="relative text-[11px] uppercase tracking-[0.16em] text-accent">SKTECH Staff Mobile</p>
        <h1 className="relative mt-1 text-2xl font-black text-foreground">Staff Mobile Dashboard</h1>
        <p className="relative mt-2 text-sm text-muted">Choose an action to continue.</p>
      </section>
      <section className="grid gap-3">
        {options.map(([title, description, href, Icon]) => (
          <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-glass-border bg-surface p-4 shadow-lg transition hover:border-accent/50 hover:bg-surface-elevated">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{title}</span><span className="mt-1 block text-xs leading-5 text-muted">{description}</span></span>
            <span className="text-lg text-muted transition group-hover:text-accent">-&gt;</span>
          </Link>
        ))}
      </section>
    </div>
  );
}