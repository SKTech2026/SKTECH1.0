import { NextRequest, NextResponse } from "next/server";

import { FeedAuthError, canManageFeedPost, requireFeedViewer } from "@/lib/feed-auth";
import { deleteFeedImage, INTERNAL_FEED_BUCKET } from "@/lib/feed-storage";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const viewer = await requireFeedViewer();
    const { id } = await context.params;
    const post = await prisma.feedPost.findUnique({ where: { id }, select: { authorId: true, imagePath: true } });
    if (!post || !canManageFeedPost(viewer, post.authorId)) {
      return NextResponse.json({ error: "Post not found or not allowed." }, { status: 404 });
    }
    await prisma.feedPost.delete({ where: { id } });
    if (post.imagePath) await deleteFeedImage(INTERNAL_FEED_BUCKET, post.imagePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof FeedAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete post." }, { status });
  }
}
