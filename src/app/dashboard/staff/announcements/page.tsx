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

export default async function StaffAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.STAFF]);

  const [events, archivedEvents] = await Promise.all([
    getActiveAnnouncements(),
    getArchivedAnnouncements(10),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Public Information Desk
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Public Announcement Feed</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Review the {ACTIVE_ANNOUNCEMENT_LIMIT} active notices currently visible
          to SK officials. The newest notice appears first.
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
                {event.description ?? "No additional announcement details."}
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
            Announcements move here automatically after their date passes or when newer notices rotate in.
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
                {event.description ?? "No additional announcement details."}
              </p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
