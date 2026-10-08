"use client";

import { Loader2, MessageSquareText, SendHorizonal, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import SKTechBotLauncher, { SKTechBotIcon } from "@/components/assistant/SKTechBotLauncher";
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
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-5 md:right-5">
        <SKTechBotLauncher open={open} onClick={() => setOpen((value) => !value)} controls="dashboard-chat-panel" />
      </div>

      {open ? (
        <div id="dashboard-chat-panel" role="region" aria-label="SKTECH AI Assistant chat" className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] motion-safe:animate-[bot-panel-in_220ms_ease-out_both] z-50 mx-auto max-w-[420px] max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/90 md:inset-auto md:bottom-24 md:right-6 md:left-auto md:w-[390px]">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(14,116,144,0.12),rgba(59,130,246,0.08),rgba(15,23,42,0.02))] px-3 py-2.5 dark:border-cyan-500/20">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(103,232,249,0.38),rgba(2,132,199,0.35),rgba(15,23,42,0.8))] text-cyan-50 ring-1 ring-white/20">
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                <SKTechBotIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">SKTECH AI Assistant</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>System help only</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  {roleLabels[role]}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close SKTECH AI Assistant panel"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-500 transition hover:border-cyan-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white"
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
                className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-cyan-300"
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
                    ? "border-cyan-200 bg-cyan-50/80 text-slate-800 dark:border-cyan-800/60 dark:bg-cyan-950/30 dark:text-slate-100"
                    : "border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                }`}
              >
                {messageItem.text}
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
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

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-2 dark:border-slate-700 dark:bg-slate-900/80">
            <MessageSquareText className="h-4 w-4 text-slate-500 dark:text-slate-300" />
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
              className="w-full border-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || !prompt.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#22d3ee,#2563eb)] text-white shadow-[0_12px_24px_-12px_rgba(37,99,235,0.9)] disabled:cursor-not-allowed disabled:opacity-50"
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
