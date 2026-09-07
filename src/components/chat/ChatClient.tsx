"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  SendHorizonal,
  Video,
  VideoOff,
} from "lucide-react";

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
  compact?: boolean;
};

const POLLING_INTERVAL_MS = 4000;
const CALL_SIGNAL_POLLING_INTERVAL_MS = 1500;
const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type CallMode = "voice" | "video";
type CallStatus = "idle" | "calling" | "ringing" | "connected" | "rejected" | "ended" | "failed";
type CallSignalType = "offer" | "answer" | "ice-candidate" | "reject" | "end";

type CallSignal = {
  id: string;
  senderId: string;
  type: CallSignalType;
  payload: unknown;
  createdAt: number;
};

type SessionDescriptionSignalPayload = {
  description?: RTCSessionDescriptionInit;
  mode?: CallMode;
};

type IceCandidateSignalPayload = {
  candidate?: RTCIceCandidateInit;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function roleLabel(contact: Pick<ChatContact, "role" | "officialRole">) {
  if (contact.role === "STAFF") return "Staff";
  return contact.officialRole ? contact.officialRole.replaceAll("_", " ") : "SK Official";
}

export default function ChatClient({ title, compact = false }: ChatClientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const callSignalCursorRef = useRef(0);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callMode, setCallMode] = useState<CallMode>("voice");
  const [incomingOffer, setIncomingOffer] = useState<CallSignal | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  const resetCallMedia = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
    }
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIceCandidatesRef.current = [];

    setLocalStream(null);
    setRemoteStream(null);
    setIncomingOffer(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
  }, []);

  const resetCallState = useCallback(() => {
    resetCallMedia();
    setCallStatus("idle");
    setCallError(null);
    setCallMode("voice");
    callSignalCursorRef.current = 0;
  }, [resetCallMedia]);

  const postCallSignal = useCallback(
    async (type: CallSignalType, payload: unknown = null) => {
      if (!selectedConversationId) return;

      const response = await fetch(
        `/api/chat/conversations/${selectedConversationId}/call-signals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, payload }),
        },
      );
      const responsePayload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(responsePayload.error ?? "Failed to send call signal.");
      }
    },
    [selectedConversationId],
  );

  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
    const nextRemoteStream = new MediaStream();
    remoteStreamRef.current = nextRemoteStream;
    setRemoteStream(nextRemoteStream);

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;
      void postCallSignal("ice-candidate", { candidate: event.candidate.toJSON() }).catch(
        (signalError) => {
          setCallStatus("failed");
          setCallError(
            signalError instanceof Error
              ? signalError.message
              : "Failed to exchange call network details.",
          );
        },
      );
    };

    peerConnection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!remoteStreamRef.current?.getTracks().some((item) => item.id === track.id)) {
          remoteStreamRef.current?.addTrack(track);
        }
      });
      setRemoteStream(remoteStreamRef.current);
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === "connected") {
        setCallStatus("connected");
        setCallError(null);
      }
      if (["failed", "disconnected", "closed"].includes(peerConnection.connectionState)) {
        setCallStatus((status) => (status === "idle" ? status : "failed"));
        setCallError("The call connection was interrupted.");
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [postCallSignal]);

  const requestLocalMedia = useCallback(async (mode: CallMode) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (mediaError) {
      const fallback =
        mode === "video"
          ? "Camera or microphone access was denied or unavailable."
          : "Microphone access was denied or unavailable.";
      throw new Error(mediaError instanceof Error ? mediaError.message : fallback);
    }
  }, []);

  const startOutgoingCall = async (mode: CallMode) => {
    if (!selectedConversationId || !selectedConversation?.otherParticipant) return;

    resetCallMedia();
    setCallStatus("calling");
    setCallMode(mode);
    setCallError(null);

    try {
      const stream = await requestLocalMedia(mode);
      const peerConnection = createPeerConnection();
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await postCallSignal("offer", { description: offer, mode });
    } catch (callStartError) {
      resetCallMedia();
      setCallStatus("failed");
      setCallError(
        callStartError instanceof Error ? callStartError.message : "Could not start the call.",
      );
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingOffer || !selectedConversationId) return;

    const payload = incomingOffer.payload as SessionDescriptionSignalPayload;
    if (!payload.description) {
      setCallStatus("failed");
      setCallError("Incoming call details were incomplete.");
      return;
    }

    const queuedIceCandidates = pendingIceCandidatesRef.current;
    resetCallMedia();
    setCallStatus("connected");
    setCallMode(payload.mode ?? "voice");
    setCallError(null);

    try {
      const stream = await requestLocalMedia(payload.mode ?? "voice");
      const peerConnection = createPeerConnection();
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      await peerConnection.setRemoteDescription(payload.description);
      for (const candidate of queuedIceCandidates) {
        await peerConnection.addIceCandidate(candidate);
      }
      pendingIceCandidatesRef.current = [];

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await postCallSignal("answer", { description: answer, mode: payload.mode ?? "voice" });
      setIncomingOffer(null);
    } catch (acceptError) {
      resetCallMedia();
      setCallStatus("failed");
      setCallError(acceptError instanceof Error ? acceptError.message : "Could not accept the call.");
    }
  };

  const rejectIncomingCall = async () => {
    try {
      await postCallSignal("reject");
    } catch (rejectError) {
      setCallError(
        rejectError instanceof Error ? rejectError.message : "Failed to reject the call.",
      );
    } finally {
      resetCallMedia();
      setCallStatus("rejected");
    }
  };

  const endCall = async () => {
    try {
      await postCallSignal("end");
    } catch (endError) {
      setCallError(endError instanceof Error ? endError.message : "Failed to notify the other user.");
    } finally {
      resetCallMedia();
      setCallStatus("ended");
    }
  };

  const toggleMicrophone = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
    const nextMuted = !isMicMuted;
    audioTracks.forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMicMuted(nextMuted);
  };

  const toggleCamera = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks() ?? [];
    const nextCameraOff = !isCameraOff;
    videoTracks.forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);
  };

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

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    resetCallState();
    return () => resetCallState();
  }, [resetCallState, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const processSignal = async (signal: CallSignal) => {
      try {
        if (signal.type === "offer") {
          const payload = signal.payload as SessionDescriptionSignalPayload;
          if (!payload.description) return;

          if (callStatus !== "idle" && callStatus !== "ended" && callStatus !== "rejected") {
            await postCallSignal("reject", { reason: "busy" });
            return;
          }

          setIncomingOffer(signal);
          setCallMode(payload.mode ?? "voice");
          setCallStatus("ringing");
          setCallError(null);
          return;
        }

        if (signal.type === "answer" && callStatus === "calling") {
          const payload = signal.payload as SessionDescriptionSignalPayload;
          if (!payload.description || !peerConnectionRef.current) return;

          await peerConnectionRef.current.setRemoteDescription(payload.description);
          for (const candidate of pendingIceCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(candidate);
          }
          pendingIceCandidatesRef.current = [];
          setCallStatus("connected");
          setCallError(null);
          return;
        }

        if (signal.type === "ice-candidate") {
          const payload = signal.payload as IceCandidateSignalPayload;
          if (!payload.candidate) return;

          if (peerConnectionRef.current?.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(payload.candidate);
          } else {
            pendingIceCandidatesRef.current.push(payload.candidate);
          }
          return;
        }

        if (signal.type === "reject") {
          resetCallMedia();
          setCallStatus("rejected");
          setCallError("The call was rejected.");
          return;
        }

        if (signal.type === "end") {
          resetCallMedia();
          setCallStatus("ended");
          setCallError("The call ended.");
        }
      } catch (signalError) {
        resetCallMedia();
        setCallStatus("failed");
        setCallError(
          signalError instanceof Error ? signalError.message : "Failed to process call signal.",
        );
      }
    };

    const pollCallSignals = async () => {
      try {
        const response = await fetch(
          `/api/chat/conversations/${selectedConversationId}/call-signals?since=${callSignalCursorRef.current}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          signals?: CallSignal[];
          cursor?: number;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load call signals.");
        }

        for (const signal of payload.signals ?? []) {
          await processSignal(signal);
          callSignalCursorRef.current = Math.max(callSignalCursorRef.current, signal.createdAt);
        }
        if (typeof payload.cursor === "number") {
          callSignalCursorRef.current = Math.max(callSignalCursorRef.current, payload.cursor);
        }
      } catch (signalLoadError) {
        setCallError(
          signalLoadError instanceof Error
            ? signalLoadError.message
            : "Call signaling is temporarily unavailable.",
        );
      }
    };

    void pollCallSignals();
    const interval = window.setInterval(() => {
      void pollCallSignals();
    }, CALL_SIGNAL_POLLING_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [callStatus, postCallSignal, resetCallMedia, selectedConversationId]);

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

  const hasSelectedPeer = Boolean(selectedConversationId && selectedConversation?.otherParticipant);
  const canStartCall = hasSelectedPeer && ["idle", "rejected", "ended", "failed"].includes(callStatus);
  const isCallActive = callStatus === "calling" || callStatus === "connected";
  const showCallPanel = callStatus !== "idle";

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md sm:rounded-3xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Municipality Chat
        </p>
        <h2 className="mt-2 text-2xl font-bold text-foreground sm:mt-3 sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Direct messages are limited to eligible SKTech users in your assigned municipality.
        </p>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="grid min-h-[70dvh] gap-4 xl:min-h-[620px] xl:grid-cols-[360px_1fr]">
        <aside
          className={`space-y-4 rounded-2xl border border-glass-border bg-surface p-4 shadow-xl backdrop-blur-md ${
            compact && selectedConversationId ? "hidden xl:block" : ""
          }`}
        >
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

        <article
          className={`min-h-[70dvh] flex-col rounded-2xl border border-glass-border bg-surface shadow-xl backdrop-blur-md xl:flex xl:min-h-[620px] ${
            compact && !selectedConversationId ? "hidden" : "flex"
          }`}
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-glass-border px-4 py-3 sm:px-5 sm:py-4">
            {compact ? (
              <button
                type="button"
                onClick={() => setSelectedConversationId(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-glass-border bg-surface-elevated text-foreground xl:hidden"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">
                {selectedConversation?.otherParticipant?.name ?? "Select a conversation"}
              </h3>
              <p className="mt-1 truncate text-xs text-muted">
                {selectedConversation?.otherParticipant
                  ? roleLabel(selectedConversation.otherParticipant)
                  : "Choose a contact or existing conversation to begin."}
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={!canStartCall}
                onClick={() => void startOutgoingCall("voice")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-3 text-xs font-semibold text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Start voice call"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Voice</span>
              </button>
              <button
                type="button"
                disabled={!canStartCall}
                onClick={() => void startOutgoingCall("video")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-glass-border bg-surface-elevated px-3 text-xs font-semibold text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Start video call"
              >
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Video</span>
              </button>
            </div>
          </div>

          {showCallPanel ? (
            <div className="border-b border-glass-border bg-surface-elevated/35 p-3 sm:p-4">
              <div className="rounded-xl border border-glass-border bg-surface p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {callStatus === "ringing"
                        ? `Incoming ${callMode} call`
                        : callStatus === "calling"
                          ? `Calling ${selectedConversation?.otherParticipant?.name ?? "participant"}`
                          : callStatus === "connected"
                            ? `${callMode === "video" ? "Video" : "Voice"} call connected`
                            : callStatus === "rejected"
                              ? "Call rejected"
                              : callStatus === "ended"
                                ? "Call ended"
                                : "Call failed"}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {callStatus === "ringing"
                        ? selectedConversation?.otherParticipant?.name ?? "Chat participant"
                        : callError ?? "WebRTC peer-to-peer prototype"}
                    </p>
                  </div>

                  {callStatus === "ringing" ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void acceptIncomingCall()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
                      >
                        <Phone className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectIncomingCall()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/15"
                      >
                        <PhoneOff className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  ) : null}

                  {isCallActive ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleMicrophone}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-glass-border bg-surface-elevated text-foreground transition hover:bg-surface"
                        aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
                      >
                        {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                      {callMode === "video" ? (
                        <button
                          type="button"
                          onClick={toggleCamera}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-glass-border bg-surface-elevated text-foreground transition hover:bg-surface"
                          aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                        >
                          {isCameraOff ? (
                            <VideoOff className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void endCall()}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/15"
                      >
                        <PhoneOff className="h-4 w-4" />
                        End
                      </button>
                    </div>
                  ) : null}
                </div>

                {isCallActive ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="min-w-0 overflow-hidden rounded-lg border border-glass-border bg-black/40">
                      {callMode === "video" ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="aspect-video w-full bg-black object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-muted">
                          Local audio
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 overflow-hidden rounded-lg border border-glass-border bg-black/40">
                      {callMode === "video" ? (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="aspect-video w-full bg-black object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-muted">
                          Remote audio
                          <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-5">
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
                <div key={message.id} className="overflow-hidden rounded-xl border border-glass-border bg-surface-elevated/45 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{message.sender.name}</p>
                    <p className="text-xs text-muted">{formatTime(message.createdAt)}</p>
                  </div>
                  {message.content ? (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{message.content}</p>
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

          <form onSubmit={sendMessage} className="border-t border-glass-border p-3 sm:p-4">
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
                className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-glass-border bg-surface-elevated/60 px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
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
