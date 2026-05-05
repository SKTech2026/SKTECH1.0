import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function StaffAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.STAFF]);

  const events = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Public Information Desk
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Public Announcement Feed</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Review latest event notices that are visible to SK officials and the federation.
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
    </div>
  );
}
