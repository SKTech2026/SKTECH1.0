import { NextRequest, NextResponse } from "next/server";

import { FeedAuthError, canViewFeedPost, requireFeedViewer } from "@/lib/feed-auth";
import { downloadFeedImage, INTERNAL_FEED_BUCKET } from "@/lib/feed-storage";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const viewer = await requireFeedViewer();
    const { id } = await context.params;
    const post = await prisma.feedPost.findUnique({ where: { id }, select: { imagePath: true, imageMimeType: true, municipalityId: true } });
    if (!post?.imagePath || !canViewFeedPost(viewer, post.municipalityId)) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }
    const image = await downloadFeedImage(INTERNAL_FEED_BUCKET, post.imagePath);
    return new NextResponse(image, { headers: { "Content-Type": post.imageMimeType ?? "image/webp", "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    const status = error instanceof FeedAuthError ? error.status : 404;
    return NextResponse.json({ error: "Image not found." }, { status });
  }
}
