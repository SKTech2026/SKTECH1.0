"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export type EventManagementItem = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  totalAttendanceCount: number;
  announcementStatus: "ACTIVE" | "ARCHIVED";
};

type EventsManagementClientProps = {
  initialEvents: EventManagementItem[];
};

const formatDateTime = (value: string) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
};

export default function EventsManagementClient({
  initialEvents,
}: EventsManagementClientProps) {
  const [events, setEvents] = useState<EventManagementItem[]>(initialEvents);
  const [isLoadingEvents, setIsLoadingEvents] = useState(
    initialEvents.length === 0
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/events", {
        cache: "no-store",
      });

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error || "Failed to fetch events");
      }

      const payload = (await res.json()) as unknown;
      if (!Array.isArray(payload)) {
        throw new Error("Invalid events response");
      }

      const normalizedEvents: EventManagementItem[] = payload.map((item) => {
        const event = item as {
          id?: unknown;
          title?: unknown;
          description?: unknown;
          eventDate?: unknown;
          createdAt?: unknown;
          updatedAt?: unknown;
          totalAttendanceCount?: unknown;
          announcementStatus?: unknown;
          _count?: { officialAttendances?: unknown };
        };

        return {
          id: String(event.id ?? ""),
          title: String(event.title ?? ""),
          description:
            typeof event.description === "string" ? event.description : null,
          eventDate: String(event.eventDate ?? ""),
          createdAt: String(event.createdAt ?? ""),
          updatedAt: String(event.updatedAt ?? ""),
          totalAttendanceCount:
            typeof event.totalAttendanceCount === "number"
              ? event.totalAttendanceCount
              : typeof event._count?.officialAttendances === "number"
                ? event._count.officialAttendances
                : 0,
          announcementStatus:
            event.announcementStatus === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
        };
      });

      setEvents(normalizedEvents);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to fetch events"
      );
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setCreateError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setActionError(null);
    setIsSubmittingCreate(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          eventDate,
        }),
      });

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error || "Failed to create event");
      }

      handleCloseCreateModal();
      await fetchEvents();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create event"
      );
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    setActionError(null);

    const shouldDelete = window.confirm(
      `Delete "${eventTitle}" and all related attendance records?`
    );
    if (!shouldDelete) return;

    setDeletingEventId(eventId);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorBody = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error || "Failed to delete event");
      }

      await fetchEvents();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete event"
      );
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-glass-border bg-surface-elevated shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-border p-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Events</h2>
            <p className="text-sm text-muted">
              The newest active announcements stay visible; older and past announcements archive automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Create Event
          </button>
        </div>

        {actionError ? (
          <div className="border-b border-red-700/40 bg-red-900/20 px-5 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}
        {loadError ? (
          <div className="border-b border-red-700/40 bg-red-900/20 px-5 py-3 text-sm text-red-200">
            {loadError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-foreground">
            <thead className="bg-surface-elevated">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Event Date</th>
                <th className="px-5 py-3 font-medium">Total Attendance Count</th>
                <th className="px-5 py-3 font-medium">Created At</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {isLoadingEvents ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Loading events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    No events found.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-surface-elevated/60">
                    <td className="px-5 py-4 font-medium text-foreground">
                      {event.title}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          event.announcementStatus === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-surface-elevated text-muted"
                        }`}
                      >
                        {event.announcementStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {event.description || "No description"}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {formatDateTime(event.eventDate)}
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {event.totalAttendanceCount}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled
                          className="rounded-md border border-glass-border px-3 py-1.5 text-xs font-medium text-muted opacity-70 cursor-not-allowed"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          disabled={deletingEventId === event.id}
                          className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingEventId === event.id ? "Deleting..." : "Delete"}
                        </button>
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="rounded-md bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-elevated/80"
                        >
                          View Attendance
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-glass-border bg-surface-elevated shadow-2xl">
            <div className="border-b border-glass-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Create Event</h3>
              <p className="mt-1 text-sm text-muted">
                Add a new event for attendance tracking.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 px-6 py-5">
              {createError ? (
                <div className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
                  {createError}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="event-title"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-md border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label
                  htmlFor="event-description"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Description
                </label>
                <textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optional event description"
                />
              </div>

              <div>
                <label
                  htmlFor="event-date"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Event Date
                </label>
                <input
                  id="event-date"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="rounded-md border border-glass-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-elevated/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingCreate ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
