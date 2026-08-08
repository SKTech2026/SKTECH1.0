import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  ACTIVE_ANNOUNCEMENT_LIMIT,
  getActiveAnnouncements,
  getArchivedAnnouncements,
} from "@/lib/announcements";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function OfficialAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.OFFICIAL]);

  const [events, archivedEvents] = await Promise.all([
    getActiveAnnouncements(),
    getArchivedAnnouncements(10),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Public Bulletin
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Public Announcements</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Active announcements are limited to {ACTIVE_ANNOUNCEMENT_LIMIT} posts and
          shown by nearest scheduled date first.
        </p>
      </section>

      <section className="space-y-4">
        {events.length === 0 ? (
          <article className="rounded-2xl border border-glass-border bg-surface p-5 text-sm text-muted">
            No announcements available.
          </article>
        ) : (
          events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-accent">
                {event.eventDate.toLocaleDateString()}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{event.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {event.description ?? "No additional details provided."}
              </p>
              <p className="mt-3 text-xs text-muted">
                Published {event.createdAt.toLocaleString()}
              </p>
            </article>
          ))
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Archive</h3>
          <p className="mt-1 text-sm text-muted">
            Announcements move here automatically after their scheduled date passes.
          </p>
        </div>
        {archivedEvents.length === 0 ? (
          <article className="rounded-2xl border border-glass-border bg-surface p-5 text-sm text-muted">
            No archived announcements yet.
          </article>
        ) : (
          archivedEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-glass-border bg-surface/70 p-5 opacity-80 shadow-xl backdrop-blur-md"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Archived {event.eventDate.toLocaleDateString()}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{event.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {event.description ?? "No additional details provided."}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
