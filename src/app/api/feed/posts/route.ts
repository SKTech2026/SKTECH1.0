import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { FeedAuthError, canViewFeedPost, requireFeedViewer } from "@/lib/feed-auth";
import { feedPostInclude, serializeFeedPost } from "@/lib/feed-serialization";
import { uploadFeedImage, INTERNAL_FEED_BUCKET } from "@/lib/feed-storage";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof FeedAuthError
    ? error.status
    : error instanceof Error && /Images must be|Image file is empty|Image is too large/.test(error.message)
      ? 400
      : 500;
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status });
}

export async function GET() {
  try {
    const viewer = await requireFeedViewer();
    const posts = await prisma.feedPost.findMany({
      where: viewer.role === Role.ADMIN
        ? {}
        : { OR: [{ municipalityId: null }, { municipalityId: viewer.municipalityId }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: feedPostInclude,
    });
    return NextResponse.json({ posts: posts.filter((post) => canViewFeedPost(viewer, post.municipalityId)).map((post) => serializeFeedPost(post, viewer.userId)) });
  } catch (error) {
    return errorResponse(error, "Failed to load feed posts.");
  }
}

export async function POST(request: NextRequest) {
  let uploadedPath: string | null = null;
  try {
    const viewer = await requireFeedViewer();
    if (viewer.role !== Role.ADMIN && viewer.role !== Role.STAFF) {
      return NextResponse.json({ error: "Officials cannot create feed posts." }, { status: 403 });
    }
    const formData = await request.formData();
    const content = typeof formData.get("content") === "string" ? String(formData.get("content")).trim() : "";
    const image = formData.get("image");
    const file = image instanceof File && image.size > 0 ? image : null;
    if (!content && !file) return NextResponse.json({ error: "Caption or image is required." }, { status: 400 });
    if (content.length > 5000) return NextResponse.json({ error: "Caption must be 5000 characters or fewer." }, { status: 400 });

    if (file) {
      const uploaded = await uploadFeedImage(file, INTERNAL_FEED_BUCKET, viewer.municipalityId ?? "province");
      uploadedPath = uploaded.objectPath;
    }
    const post = await prisma.feedPost.create({
      data: {
        content: content || null,
        imagePath: uploadedPath,
        imageMimeType: file?.type ?? null,
        authorId: viewer.userId,
        municipalityId: viewer.role === Role.STAFF ? viewer.municipalityId : null,
      },
      include: feedPostInclude,
    });
    return NextResponse.json({ post: serializeFeedPost(post, viewer.userId) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create feed post.");
  }
}
