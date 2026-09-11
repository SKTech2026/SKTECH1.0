import { NextResponse } from "next/server";

import { FeedAuthError, requireFeedViewer } from "@/lib/feed-auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    await requireFeedViewer();
    return NextResponse.json(
      { error: "Permanent deletion is disabled. Use edit, unpublish, deactivate, or archive instead." },
      { status: 409 },
    );
  } catch (error) {
    const status = error instanceof FeedAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete post." }, { status });
  }
}
