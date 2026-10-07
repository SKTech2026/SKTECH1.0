"use client";

import { Bot, Loader2, MessageSquareText, SendHorizonal, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { SKTECH_ROLE_HELP, type DashboardRole } from "@/lib/assistant/sktech-help";

type SKTechAssistantProps = {
  role: DashboardRole;
};

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const roleLabels: Record<DashboardRole, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  OFFICIAL: "Official",
  KK_MEMBER: "KK Member",
};

export default function SKTechAssistant({ role }: SKTechAssistantProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask SKTECH about your dashboard, navigation, reports, profiles, or member workflow.",
    },
  ]);

  const quickPrompts = useMemo(() => SKTECH_ROLE_HELP[role].quickPrompts, [role]);

  const handleSubmit = async (nextMessage?: string) => {
    const trimmed = (nextMessage ?? prompt).trim();

    if (!trimmed || loading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setPrompt("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant/sktech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          currentPath: pathname,
          recentContext: messages.map((messageItem) => messageItem.text).slice(-3),
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "SKTECH assistant is unavailable right now.");
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: data.error ?? "I can only help with SKTECH system features, navigation, and support.",
          },
        ]);
        return;
      }

      const reply = data.reply ?? "I can only help with SKTECH system features, navigation, and support.";
      setMessages((current) => [...current, { role: "assistant", text: reply }]);
    } catch {
      const fallbackReply = "AI assistant is not configured yet. You can still ask basic SKTECH navigation questions.";
      setError("The SKTECH assistant is temporarily unavailable.");
      setMessages((current) => [...current, { role: "assistant", text: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-accent/40 bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,var(--color-accent)_26%,transparent),_transparent_60%)] px-4 py-3 text-sm font-semibold text-foreground shadow-[0_18px_45px_-18px_var(--color-ring)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-18px_var(--color-ring)] md:bottom-6 md:right-6"
        aria-label={open ? "Close SKTECH assistant" : "Open SKTECH assistant"}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Bot className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">Ask SKTECH</span>
      </button>

      {open ? (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[420px] rounded-3xl border border-glass-border bg-surface/95 p-3 shadow-[0_30px_80px_-24px_var(--shadow-color)] backdrop-blur-xl md:inset-auto md:bottom-24 md:right-6 md:left-auto md:w-[390px]">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-glass-border bg-surface-elevated/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">SKTECH Assistant</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{roleLabels[role]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant panel"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-glass-border text-muted transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((promptItem) => (
              <button
                key={promptItem}
                type="button"
                onClick={() => handleSubmit(promptItem)}
                className="rounded-full border border-glass-border bg-surface-elevated/60 px-2.5 py-1.5 text-[11px] font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
              >
                {promptItem}
              </button>
            ))}
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {messages.map((messageItem, index) => (
              <div
                key={`${messageItem.role}-${index}`}
                className={`rounded-2xl border px-3 py-2 text-sm ${
                  messageItem.role === "assistant"
                    ? "border-accent/20 bg-accent/10 text-foreground"
                    : "border-glass-border bg-surface-elevated/60 text-foreground"
                }`}
              >
                {messageItem.text}
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              {error}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-glass-border bg-surface-elevated/70 p-2">
            <MessageSquareText className="h-4 w-4 text-muted" />
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Ask SKTECH about this page..."
              aria-label="Ask SKTECH"
              className="w-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || !prompt.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
