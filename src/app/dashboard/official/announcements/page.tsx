import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import {
  ACTIVE_ANNOUNCEMENT_LIMIT,
  getActiveAnnouncements,
  getArchivedAnnouncements,
  countArchivedAnnouncements,
} from "@/lib/announcements";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

const ARCHIVE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_ARCHIVE_PAGE_SIZE = ARCHIVE_PAGE_SIZE_OPTIONS[0];

function parsePage(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function parsePageSize(value: string | string[] | undefined) {
  const pageSize = Number(Array.isArray(value) ? value[0] : value);
  return ARCHIVE_PAGE_SIZE_OPTIONS.includes(
    pageSize as (typeof ARCHIVE_PAGE_SIZE_OPTIONS)[number],
  )
    ? pageSize
    : DEFAULT_ARCHIVE_PAGE_SIZE;
}

export default async function OfficialAnnouncementsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedPage = parsePage(resolvedSearchParams.archivePage);
  const archivePageSize = parsePageSize(resolvedSearchParams.archivePageSize);
  const totalArchived = await countArchivedAnnouncements();
  const totalArchivePages = Math.max(1, Math.ceil(totalArchived / archivePageSize));
  const archivePage = Math.min(requestedPage, totalArchivePages);

  const [events, archivedEvents] = await Promise.all([
    getActiveAnnouncements(),
    getArchivedAnnouncements({
      skip: (archivePage - 1) * archivePageSize,
      take: archivePageSize,
    }),
  ]);

  const firstArchived = totalArchived === 0 ? 0 : (archivePage - 1) * archivePageSize + 1;
  const lastArchived = totalArchived === 0 ? 0 : firstArchived + archivedEvents.length - 1;
  const archivePageHref = (nextPage: number, nextPageSize = archivePageSize) => {
    const params = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => params.append(key, item));
      } else if (value !== undefined) {
        params.set(key, value);
      }
    });
    params.set("archivePage", String(nextPage));
    params.set("archivePageSize", String(nextPageSize));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Public Bulletin
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Public Announcements</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Active announcements are limited to {ACTIVE_ANNOUNCEMENT_LIMIT} posts and
          show the newest posts first.
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
            Announcements move here automatically after their scheduled date passes or when newer posts rotate in.
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
        {totalArchived > 0 ? (
          <footer className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-surface/70 px-4 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p>
              Showing {firstArchived}-{lastArchived} of {totalArchived}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1" aria-label="Archive page size">
                <span className="mr-1 text-xs">Rows</span>
                {ARCHIVE_PAGE_SIZE_OPTIONS.map((option) => (
                  <Link
                    key={option}
                    href={archivePageHref(1, option)}
                    aria-current={option === archivePageSize ? "page" : undefined}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      option === archivePageSize
                        ? "bg-accent text-accent-foreground"
                        : "text-muted hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    {option}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {archivePage > 1 ? (
                  <Link
                    href={archivePageHref(archivePage - 1)}
                    aria-label="Go to previous archived announcements page"
                    className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                  >
                    Previous
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-muted opacity-50"
                  >
                    Previous
                  </span>
                )}
                <span className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Page {archivePage} of {totalArchivePages}
                </span>
                {archivePage < totalArchivePages ? (
                  <Link
                    href={archivePageHref(archivePage + 1)}
                    aria-label="Go to next archived announcements page"
                    className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                  >
                    Next
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="cursor-not-allowed rounded-lg border border-glass-border px-3 py-1.5 text-xs font-semibold text-muted opacity-50"
                  >
                    Next
                  </span>
                )}
              </div>
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}
