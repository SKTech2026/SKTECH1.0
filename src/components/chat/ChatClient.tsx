"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Paperclip, SendHorizonal } from "lucide-react";

type ChatContact = {
  userId: string;
  name: string;
  email: string | null;
  role: "OFFICIAL" | "STAFF";
  officialRole: string | null;
  municipality: string | null;
};

type ChatConversation = {
  id: string;
  unread: boolean;
  updatedAt: string;
  otherParticipant: ChatContact | null;
  latestMessage: {
    content: string | null;
    createdAt: string;
    attachmentCount: number;
  } | null;
};

type ChatMessage = {
  id: string;
  senderId: string;
  content: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: "OFFICIAL" | "STAFF";
  };
  attachments: {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    downloadUrl: string;
  }[];
};

type ChatClientProps = {
  title: string;
};

const POLLING_INTERVAL_MS = 4000;

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function roleLabel(contact: Pick<ChatContact, "role" | "officialRole">) {
  if (contact.role === "STAFF") return "Staff";
  return contact.officialRole ? contact.officialRole.replaceAll("_", " ") : "SK Official";
}

export default function ChatClient({ title }: ChatClientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  const loadContactsAndConversations = useCallback(async () => {
    try {
      const [contactsResponse, conversationsResponse] = await Promise.all([
        fetch("/api/chat/contacts", { cache: "no-store" }),
        fetch("/api/chat/conversations", { cache: "no-store" }),
      ]);

      const contactsPayload = (await contactsResponse.json()) as {
        contacts?: ChatContact[];
        error?: string;
      };
      const conversationsPayload = (await conversationsResponse.json()) as {
        conversations?: ChatConversation[];
        error?: string;
      };

      if (!contactsResponse.ok) {
        throw new Error(contactsPayload.error ?? "Failed to load contacts.");
      }
      if (!conversationsResponse.ok) {
        throw new Error(conversationsPayload.error ?? "Failed to load conversations.");
      }

      setContacts(Array.isArray(contactsPayload.contacts) ? contactsPayload.contacts : []);
      setConversations(
        Array.isArray(conversationsPayload.conversations)
          ? conversationsPayload.conversations
          : [],
      );
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load chat.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        messages?: ChatMessage[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load messages.");
      }

      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
      setError(null);
      void loadContactsAndConversations();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load messages.");
    }
  }, [loadContactsAndConversations]);

  useEffect(() => {
    void loadContactsAndConversations();
  }, [loadContactsAndConversations]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadMessages(selectedConversationId);
    const interval = window.setInterval(() => {
      void loadMessages(selectedConversationId);
    }, POLLING_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loadMessages, selectedConversationId]);

  const openConversation = async (recipientUserId: string) => {
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUserId }),
      });
      const payload = (await response.json()) as { conversationId?: string; error?: string };
      if (!response.ok || !payload.conversationId) {
        throw new Error(payload.error ?? "Failed to open conversation.");
      }
      setSelectedConversationId(payload.conversationId);
      await loadContactsAndConversations();
      await loadMessages(payload.conversationId);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Failed to open conversation.");
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedConversationId || isSending) return;
    if (!messageText.trim() && !attachment) {
      setError("Message text or attachment is required.");
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.set("content", messageText.trim());
      if (attachment) {
        formData.set("attachment", attachment);
      }

      const response = await fetch(`/api/chat/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send message.");
      }

      setMessageText("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadMessages(selectedConversationId);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Municipality Chat
        </p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Direct messages are limited to eligible SKTech users in your assigned municipality.
        </p>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="grid min-h-[620px] gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conversations</h3>
            <div className="mt-3 space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted">Loading chat...</p>
              ) : conversations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-glass-border p-3 text-sm text-muted">
                  No conversations yet.
                </p>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      selectedConversationId === conversation.id
                        ? "border-accent/50 bg-accent/15"
                        : "border-glass-border bg-surface-elevated/40 hover:bg-surface-elevated"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {conversation.otherParticipant?.name ?? "Conversation"}
                      </p>
                      {conversation.unread ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      {conversation.latestMessage?.content ||
                        (conversation.latestMessage?.attachmentCount
                          ? "Attachment"
                          : roleLabel(conversation.otherParticipant ?? { role: "OFFICIAL", officialRole: null }))}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-glass-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
            <div className="mt-3 max-h-[310px] space-y-2 overflow-y-auto pr-1">
              {contacts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-glass-border p-3 text-sm text-muted">
                  No eligible contacts found.
                </p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.userId}
                    type="button"
                    onClick={() => void openConversation(contact.userId)}
                    className="w-full rounded-xl border border-glass-border bg-surface-elevated/40 px-3 py-2 text-left transition hover:bg-surface-elevated"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">{contact.name}</p>
                    <p className="mt-1 truncate text-xs text-muted">{roleLabel(contact)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <article className="flex min-h-[620px] flex-col rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md">
          <div className="border-b border-glass-border px-5 py-4">
            <h3 className="text-base font-semibold text-foreground">
              {selectedConversation?.otherParticipant?.name ?? "Select a conversation"}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {selectedConversation?.otherParticipant
                ? roleLabel(selectedConversation.otherParticipant)
                : "Choose a contact or existing conversation to begin."}
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {!selectedConversationId ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                No conversation selected.
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">
                No messages yet.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="rounded-xl border border-glass-border bg-surface-elevated/45 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{message.sender.name}</p>
                    <p className="text-xs text-muted">{formatTime(message.createdAt)}</p>
                  </div>
                  {message.content ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
                  ) : null}
                  {message.attachments.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((item) => (
                        <a
                          key={item.id}
                          href={item.downloadUrl}
                          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-glass-border bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-elevated"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-accent" />
                          <span className="truncate">{item.fileName}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-glass-border p-4">
            {attachment ? (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface-elevated/50 px-3 py-2 text-xs text-foreground">
                <span className="truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="font-semibold text-rose-300"
                >
                  Remove
                </button>
              </div>
            ) : null}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                disabled={!selectedConversationId || isSending}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-glass-border bg-surface-elevated text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                disabled={!selectedConversationId || isSending}
                rows={2}
                placeholder="Write a message..."
                className="min-h-11 flex-1 resize-none rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!selectedConversationId || isSending}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                Send
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
