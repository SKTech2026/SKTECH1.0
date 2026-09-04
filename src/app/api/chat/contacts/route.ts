import { NextResponse } from "next/server";

import {
  ChatAuthError,
  getEligibleChatContacts,
  requireChatUser,
} from "@/lib/chat-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const current = await requireChatUser();
    const contacts = await getEligibleChatContacts(current);
    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error) {
    const status = error instanceof ChatAuthError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Failed to load chat contacts.";
    return NextResponse.json({ error: message }, { status });
  }
}
