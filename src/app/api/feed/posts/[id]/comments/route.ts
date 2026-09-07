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
    const body = (await request.json().catch(() => ({}))) as { content?: unknown };
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 1000) return NextResponse.json({ error: "Comment must be 1-1000 characters." }, { status: 400 });
    const comment = await prisma.feedComment.create({ data: { postId: id, userId: viewer.userId, content }, include: { user: { select: { id: true, name: true, email: true, image: true } } } });
    return NextResponse.json({ comment: { id: comment.id, content: comment.content, createdAt: comment.createdAt, author: { id: comment.user.id, name: comment.user.name || comment.user.email || "SKTECH User", photoUrl: comment.user.image?.startsWith("/") ? comment.user.image : null } } }, { status: 201 });
  } catch (error) {
    const status = error instanceof FeedAuthError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to add comment." }, { status });
  }
}
