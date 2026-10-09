"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageCircle, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PushControls from "@/components/notifications/PushControls";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type NotificationBellProps = { chatHref?: string; className?: string };
type NotificationItem = {
  id: string;
  category: string;
  title: string;
  body: string;
  href: string | null;
  important: boolean;
  unread: boolean;
  createdAt: string;
};
type Filter = "All" | "Unread" | "Important";

function safeHref(value: string | null): string | null {
  if (value === "/") return value;
  return value && /^\/(?:dashboard|mobile)(?:\/[a-zA-Z0-9-]+)*\/?$/.test(value) ? value : null;
}

export default function NotificationBell({ chatHref, className }: NotificationBellProps) {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load notifications.");
      const data = await response.json() as { notifications?: NotificationItem[] };
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setError(null);
    } catch {
      setError("Unable to load notifications right now.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (isOpen) void load(); }, [isOpen, load]);
  useEffect(() => {
    const refresh = () => {
      if (!isOpen && document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isOpen, load]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [isOpen]);

  const unreadCount = items.filter((item) => item.unread).length;
  const visible = useMemo(() => items.filter((item) => filter === "All" || (filter === "Unread" ? item.unread : item.important)), [items, filter]);

  const markRead = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error();
      setItems((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item));
      setError(null);
    } catch { setError("Could not mark this notification as read."); }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
      if (!response.ok) throw new Error();
      setItems((current) => current.map((item) => ({ ...item, unread: false })));
      setError(null);
    } catch { setError("Could not mark notifications as read."); }
  };

  const openItem = (item: NotificationItem) => {
    if (item.unread) void markRead(item.id);
    const href = safeHref(item.href);
    if (href) { setIsOpen(false); router.push(href); }
  };

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setIsOpen((value) => !value)} className={className ?? "relative grid h-11 w-11 place-items-center rounded-xl border border-glass-border bg-surface-elevated text-foreground"} aria-label={t("Open notifications")} aria-expanded={isOpen} aria-haspopup="dialog">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white" aria-label={`${unreadCount} unread notifications`}>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <div role="dialog" aria-label={t("Notifications")} className="fixed inset-x-3 top-[calc(4.75rem_+_env(safe-area-inset-top))] z-[70] mx-auto flex max-h-[min(70dvh,34rem)] w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-glass-border bg-surface text-foreground shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:mx-0 sm:w-[23rem]">
          <div className="flex items-center justify-between border-b border-glass-border px-4 py-3">
            <div><h2 className="text-base font-bold">{t("Notifications")}</h2><p className="text-xs text-muted">{unreadCount ? `${unreadCount} ${t("unread")}` : t("You’re all caught up")}</p></div>
            <div className="flex gap-1">
              {unreadCount > 0 ? <button type="button" onClick={() => void markAllRead()} aria-label={t("Mark all notifications as read")} className="grid h-10 w-10 place-items-center rounded-lg text-accent hover:bg-surface-elevated"><CheckCheck className="h-4 w-4" /></button> : null}
              <button type="button" onClick={() => setIsOpen(false)} aria-label={t("Close notifications")} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-elevated"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div role="tablist" aria-label={t("Notification filter")} className="flex gap-2 border-b border-glass-border px-3 py-2">
            {(["All", "Unread", "Important"] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={filter === tab} onClick={() => setFilter(tab)} className={`min-h-10 rounded-full px-3 text-xs font-bold ${filter === tab ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-elevated"}`}>{t(tab)}</button>)}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? <p className="px-3 py-8 text-center text-sm text-muted">{t("Loading notifications...")}</p>
              : error ? <p role="alert" className="px-3 py-5 text-center text-sm text-rose-400">{t(error)} <button type="button" onClick={() => void load()} className="font-semibold underline">{t("Retry")}</button></p>
                : visible.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">{filter === "All" ? t("No notifications yet.") : language === "en" ? `No ${filter.toLowerCase()} notifications.` : t("No notifications in this filter.")}</p>
                  : visible.map((item) => <div key={item.id} className={`mb-1 flex items-start gap-2 rounded-2xl border p-2 ${item.unread ? "border-accent/30 bg-accent/10" : "border-transparent hover:bg-surface-elevated"}`}>
                      <button type="button" onClick={() => openItem(item)} className="flex min-h-14 min-w-0 flex-1 items-start gap-3 rounded-xl p-1 text-left">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">{item.category === "Chat" ? <MessageCircle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}</span>
                        <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-wide text-accent">{t(item.category)}{item.important ? ` · ${t("Important")}` : ""}</span><span className="block break-words text-sm font-semibold">{item.title}</span><span className="mt-0.5 block break-words text-xs leading-5 text-muted">{item.body}</span><span className="mt-1 block text-[10px] text-muted">{new Date(item.createdAt).toLocaleString()}</span></span>
                      </button>
                      {item.unread ? <button type="button" onClick={() => void markRead(item.id)} aria-label={`Mark ${item.title} as read`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-accent hover:bg-surface-elevated"><CheckCheck className="h-4 w-4" /></button> : null}
                    </div>)}
            <PushControls onUpdated={() => void load()} />
          </div>
          {chatHref ? <Link href={chatHref} onClick={() => setIsOpen(false)} className="border-t border-glass-border px-4 py-3 text-center text-xs font-semibold text-accent hover:bg-surface-elevated">{t("Open chats")}</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
