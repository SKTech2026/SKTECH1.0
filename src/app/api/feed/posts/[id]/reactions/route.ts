import { FeedReactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { FeedAuthError, canViewFeedPost, requireFeedViewer } from "@/lib/feed-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await requireFeedViewer();
    const { id } = await context.params;
    const post = await prisma.feedPost.findUnique({ where: { id }, select: { municipalityId: true } });
    if (!post || !canViewFeedPost(viewer, post.municipalityId)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const body = (await request.json().catch(() => ({}))) as { type?: unknown };
    const type = typeof body.type === "string" && Object.values(FeedReactionType).includes(body.type as FeedReactionType)
      ? body.type as FeedReactionType
      : FeedReactionType.LIKE;
    const existing = await prisma.feedReaction.findUnique({ where: { postId_userId: { postId: id, userId: viewer.userId } } });
    if (existing?.type === type) {
      await prisma.feedReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ reaction: null });
    }
    const reaction = existing
      ? await prisma.feedReaction.update({ where: { id: existing.id }, data: { type } })
      : await prisma.feedReaction.create({ data: { postId: id, userId: viewer.userId, type } });
    return NextResponse.json({ reaction: reaction.type });
  } catch (error) {
    const status = error instanceof FeedAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update reaction." }, { status });
  }
}
