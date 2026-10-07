import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  SKTECH_DEFAULT_SYSTEM_PROMPT,
  getLocalFallbackReply,
  getRoleAwareContext,
  normalizeRole,
  validateAssistantMessage,
} from "@/lib/assistant/sktech-help";

const MODEL_NAME = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const role = normalizeRole(String(session.user.role));

  if (!role) {
    return NextResponse.json({ error: "Unsupported dashboard role." }, { status: 403 });
  }

  let payload: Record<string, unknown> | undefined;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = typeof payload.message === "string" ? payload.message : "";
  const currentPath = typeof payload.currentPath === "string" ? payload.currentPath : "/dashboard";
  const recentContext = Array.isArray(payload.recentContext)
    ? payload.recentContext.filter((item): item is string => typeof item === "string").slice(0, 4)
    : [];

  const validation = validateAssistantMessage(message);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const userMessage = validation.valid ? String(validation.trimmed) : "";
  const context = getRoleAwareContext(role, currentPath);
  const fallbackReply = getLocalFallbackReply(userMessage, role, currentPath);

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ reply: fallbackReply });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `${SKTECH_DEFAULT_SYSTEM_PROMPT}\n\nROLE_CONTEXT:\n${JSON.stringify({
                  role,
                  currentPath,
                  allowedFeatures: context.allowedFeatures,
                  routeHint: context.routeHint,
                  recentContext,
                })}`,
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `User asks: ${userMessage}\n\nCurrent path: ${currentPath}\n\nRole: ${role}\n\nAllowed feature list: ${context.allowedFeatures.join(", ")}`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ reply: fallbackReply });
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const replyText = data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join(" ")
      .trim();

    if (!replyText) {
      return NextResponse.json({ reply: fallbackReply });
    }

    const sanitizedReply = replyText
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (/api key|secret|password|database|env value|internal prompt|system prompt/i.test(sanitizedReply)) {
      return NextResponse.json({ reply: fallbackReply });
    }

    return NextResponse.json({ reply: sanitizedReply });
  } catch {
    return NextResponse.json({ reply: fallbackReply });
  }
}
