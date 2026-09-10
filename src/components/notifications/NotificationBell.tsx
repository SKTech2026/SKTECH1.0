"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type NotificationBellProps = {
  chatHref: string;
  className?: string;
};

type Conversation = {
  id: string;
  unread?: boolean;
  updatedAt?: string;
  otherParticipant?: {
    name?: string | null;
    role?: string | null;
    position?: string | null;
    officialRole?: string | null;
    barangay?: string | null;
    photoUrl?: string | null;
  } | null;
  latestMessage?: {
    content?: string | null;
    createdAt?: string;
    unsentAt?: string | null;
    attachmentCount?: number;
  } | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SK";
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function participantLabel(participant: Conversation["otherParticipant"]) {
  if (!participant) return "SKTECH contact";
  const role = participant.role === "STAFF"
    ? "Staff"
    : participant.position ?? participant.officialRole ?? "SK Official";
  return participant.barangay ? `${role} · Barangay ${participant.barangay}` : role;
}

function messagePreview(message: Conversation["latestMessage"]) {
  if (!message) return "No messages yet";
  if (message.unsentAt) return "Message unavailable";
  if (message.content?.trim()) return message.content;
  if (message.attachmentCount) return "Sent an attachment";
  return "New chat activity";
}

export default function NotificationBell({ chatHref, className }: NotificationBellProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/chat/conversations", { cache: "no-store" });
        const payload = (await response.json()) as
          | Conversation[]
          | { conversations?: Conversation[] };
        if (!response.ok) throw new Error("Unable to load notifications.");
        const nextConversations = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.conversations)
            ? payload.conversations
            : [];
        if (!cancelled) {
          setConversations(nextConversations);
          setHasError(false);
        }
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const unreadCount = conversations.filter((conversation) => conversation.unread).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={className}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-glass-border bg-surface shadow-2xl"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-glass-border px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Notifications</h2>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Chat</p>
            </div>
            {unreadCount > 0 ? <span className="text-xs font-semibold text-accent">{unreadCount} unread</span> : null}
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
            {isLoading ? (
              <div className="px-3 py-6 text-center text-sm text-muted">Loading notifications...</div>
            ) : hasError ? (
              <div className="px-3 py-6 text-center text-sm text-rose-400">Unable to load notifications right now.</div>
            ) : conversations.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted">No recent chat activity</div>
            ) : (
              conversations.slice(0, 10).map((conversation) => {
                const participant = conversation.otherParticipant;
                const name = participant?.name ?? "SKTECH contact";
                return (
                  <Link
                    key={conversation.id}
                    href={chatHref}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-surface-elevated ${conversation.unread ? "bg-accent/10" : ""}`}
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-bold text-accent">
                      {participant?.photoUrl ? (
                        <img src={participant.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : initials(name)}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                        <span className="shrink-0 text-[11px] text-muted">{formatTime(conversation.latestMessage?.createdAt ?? conversation.updatedAt)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{participantLabel(participant)}</span>
                      <span className={`mt-1 block truncate text-xs ${conversation.unread ? "font-semibold text-foreground" : "text-muted"}`}>
                        {messagePreview(conversation.latestMessage)}
                      </span>
                    </span>
                    {conversation.unread ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" /> : null}
                  </Link>
                );
              })
            )}
          </div>

          <div className="border-t border-glass-border p-2">
            <Link href={chatHref} onClick={() => setIsOpen(false)} className="flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-accent transition hover:bg-surface-elevated">
              Open chats
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
