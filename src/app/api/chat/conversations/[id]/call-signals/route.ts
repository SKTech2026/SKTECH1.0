import { NextRequest, NextResponse } from "next/server";

import {
  ChatAuthError,
  requireChatUser,
  requireConversationAccess,
} from "@/lib/chat-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const CALL_SIGNAL_TYPES = new Set(["offer", "answer", "ice-candidate", "reject", "end"]);
const SIGNAL_TTL_MS = 2 * 60 * 1000;
const MAX_SIGNAL_PAYLOAD_LENGTH = 20000;

type CallSignal = {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  payload: unknown;
  createdAt: number;
};

// Prototype-only in-memory signaling store.
// This is not durable across server restarts and is not reliable across multi-instance deployments.
// A production version should use durable signaling plus TURN for harder network conditions.
const signalStore = new Map<string, CallSignal[]>();

function cleanupSignals(conversationId?: string) {
  const cutoff = Date.now() - SIGNAL_TTL_MS;
  const entries = conversationId
    ? [[conversationId, signalStore.get(conversationId) ?? []] as const]
    : Array.from(signalStore.entries());

  for (const [key, signals] of entries) {
    const freshSignals = signals.filter((signal) => signal.createdAt >= cutoff);
    if (freshSignals.length > 0) {
      signalStore.set(key, freshSignals);
    } else {
      signalStore.delete(key);
    }
  }
}

function appendSignal(signal: CallSignal) {
  cleanupSignals(signal.conversationId);
  const existing = signalStore.get(signal.conversationId) ?? [];
  const nextSignals =
    signal.type === "reject" || signal.type === "end"
      ? existing.filter((item) => item.type !== "offer" && item.type !== "answer")
      : existing;

  nextSignals.push(signal);
  signalStore.set(signal.conversationId, nextSignals.slice(-100));
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const current = await requireChatUser();
    const { id } = await context.params;
    await requireConversationAccess(current, id);
    cleanupSignals(id);

    const sinceParam = Number(request.nextUrl.searchParams.get("since") ?? "0");
    const since = Number.isFinite(sinceParam) ? sinceParam : 0;
    const signals = (signalStore.get(id) ?? []).filter(
      (signal) => signal.createdAt > since && signal.senderId !== current.userId,
    );

    return NextResponse.json(
      {
        signals,
        cursor: signals.reduce(
          (latest, signal) => Math.max(latest, signal.createdAt),
          since,
        ),
      },
      { status: 200 },
    );
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to load call signals.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const current = await requireChatUser();
    const { id } = await context.params;
    await requireConversationAccess(current, id);

    const body = (await request.json().catch(() => ({}))) as {
      type?: unknown;
      payload?: unknown;
    };
    const type = typeof body.type === "string" ? body.type : "";

    if (!CALL_SIGNAL_TYPES.has(type)) {
      return NextResponse.json({ error: "Unsupported call signal type." }, { status: 400 });
    }

    const payloadText = JSON.stringify(body.payload ?? null);
    if (payloadText.length > MAX_SIGNAL_PAYLOAD_LENGTH) {
      return NextResponse.json({ error: "Call signal payload is too large." }, { status: 400 });
    }

    const signal: CallSignal = {
      id: crypto.randomUUID(),
      conversationId: id,
      senderId: current.userId,
      type,
      payload: body.payload ?? null,
      createdAt: Date.now(),
    };

    appendSignal(signal);

    return NextResponse.json({ signal }, { status: 201 });
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to send call signal.";
    return NextResponse.json({ error: message }, { status });
  }
}
