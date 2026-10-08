"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { useLanguage } from "@/components/i18n/LanguageProvider";
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
  const reducedMotion = useReducedMotion();
  const { t } = useLanguage();
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
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-6 md:right-6">
        {open ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            id="dashboard-chat-panel"
            role="region"
            aria-label="SKTECH AI Assistant chat"
            className="mb-3 max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] max-w-[380px] overflow-y-auto rounded-3xl border border-[#dbe7ff] bg-white/95 shadow-[0_24px_70px_-34px_rgba(6,19,45,0.9)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/95"
          >
            <div className="flex items-center justify-between bg-[#06132d] px-4 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="relative rounded-full bg-[radial-gradient(circle_at_30%_30%,#38bdf8,#0a3aa2_70%)] p-2 text-cyan-50 ring-1 ring-cyan-200/50">
                  <SKTechBotIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-black">{t("SKTECH AI Assistant")}</p>
                  <p className="text-xs text-white/70">Role-aware system help · {roleLabels[role]}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close SKTECH AI Assistant panel"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div aria-live="polite" aria-busy={loading} className="max-h-[48vh] space-y-3 overflow-y-auto px-4 py-4 sm:max-h-[360px]">
              {messages.map((messageItem, index) => (
                <div key={`${messageItem.role}-${index}`} className={`flex ${messageItem.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${messageItem.role === "user" ? "bg-[#0a3aa2] text-white" : "bg-[#eef4ff] text-[#06132d] dark:bg-slate-800 dark:text-slate-100"}`}>
                    {messageItem.text}
                  </p>
                </div>
              ))}
              {loading ? <p className="flex items-center gap-2 text-sm text-[#435878] dark:text-slate-300"><Loader2 className="h-4 w-4 motion-safe:animate-spin" /> {t("Thinking...")}</p> : null}
            </div>

            {error ? <p role="alert" className="mx-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">{error}</p> : null}

            <div className="border-t border-[#edf2ff] px-4 py-3 dark:border-slate-700">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickPrompts.map((promptItem) => (
                  <button
                    key={promptItem}
                    type="button"
                    onClick={() => void handleSubmit(promptItem)}
                    disabled={loading}
                    className="shrink-0 rounded-full border border-[#bfd1f8] px-3 py-1.5 text-xs font-bold text-[#0a3aa2] disabled:opacity-50 dark:border-cyan-700 dark:text-cyan-200"
                  >
                    {promptItem}
                  </button>
                ))}
              </div>
              <form
                className="mt-2 flex items-center gap-2 rounded-2xl border border-[#dbe7ff] bg-[#f6f9ff] p-2 dark:border-slate-700 dark:bg-slate-900"
                onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }}
              >
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask SKTECH about this page..."
                  aria-label={t("Ask SKTECH")}
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#06132d] outline-none placeholder:text-[#24385f]/45 dark:text-slate-100 dark:placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  aria-label={t("Send message")}
                  disabled={loading || !prompt.trim()}
                  className="rounded-xl bg-[#cf2638] p-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : null}
        <SKTechBotLauncher open={open} onClick={() => setOpen((value) => !value)} controls="dashboard-chat-panel" label={t("SKTECH AI Assistant")} />
      </div>
    </>
  );
}
