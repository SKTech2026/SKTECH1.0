import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getActiveAnnouncements } from "@/lib/announcements";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);
  const announcements = await getActiveAnnouncements(10);

  return (
    <div className="space-y-4">
      <Link href="/mobile/official" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <header className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Official Mobile</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Announcements</h1>
        <p className="mt-1 text-sm text-muted">Current federation announcements and events.</p>
      </header>
      <section className="space-y-3">
        {announcements.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-glass-border bg-surface p-4 text-sm text-muted">
            No announcements available.
          </p>
        ) : (
          announcements.map((item) => (
            <article key={item.id} className="rounded-2xl border border-glass-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-cyan-300">
                <CalendarDays className="h-4 w-4" />
                {item.eventDate.toLocaleDateString()}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.description ?? "No details provided."}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
