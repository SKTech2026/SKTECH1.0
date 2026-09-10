import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { FeedAuthError, canViewFeedPost, requireFeedViewer } from "@/lib/feed-auth";
import { feedPostInclude, serializeFeedPost } from "@/lib/feed-serialization";
import { uploadFeedImage, INTERNAL_FEED_BUCKET } from "@/lib/feed-storage";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_TAKE = 10;
const MAX_TAKE = 20;

function parseTake(value: string | null) {
  const take = Number(value);
  return Number.isInteger(take) && take >= 1
    ? Math.min(take, MAX_TAKE)
    : DEFAULT_TAKE;
}

function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof FeedAuthError
    ? error.status
    : error instanceof Error && /Images must be|Image file is empty|Image is too large/.test(error.message)
      ? 400
      : 500;
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const viewer = await requireFeedViewer();
    const take = parseTake(request.nextUrl.searchParams.get("take"));
    const cursorId = request.nextUrl.searchParams.get("cursor");
    const visibilityWhere = viewer.role === Role.ADMIN
      ? {}
      : { OR: [{ municipalityId: null }, { municipalityId: viewer.municipalityId }] };
    let cursorWhere = {};

    if (cursorId) {
      const cursorPost = await prisma.feedPost.findFirst({
        where: { AND: [visibilityWhere, { id: cursorId }] },
        select: { id: true, createdAt: true },
      });

      if (cursorPost) {
        cursorWhere = {
          OR: [
            { createdAt: { lt: cursorPost.createdAt } },
            { createdAt: cursorPost.createdAt, id: { lt: cursorPost.id } },
          ],
        };
      }
    }

    const posts = await prisma.feedPost.findMany({
      where: { AND: [visibilityWhere, cursorWhere] },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      include: feedPostInclude,
    });
    const visiblePosts = posts.filter((post) => canViewFeedPost(viewer, post.municipalityId));
    const hasMore = visiblePosts.length > take;
    const pagePosts = hasMore ? visiblePosts.slice(0, take) : visiblePosts;
    return NextResponse.json({
      posts: pagePosts.map((post) => serializeFeedPost(post, viewer.userId)),
      nextCursor: hasMore ? pagePosts[pagePosts.length - 1].id : null,
      hasMore,
    });
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
