import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { FeedAuthError, requireFeedViewer } from "@/lib/feed-auth";
import { prisma } from "@/lib/db";
import { deleteFeedImage, PUBLIC_NEWS_BUCKET, uploadFeedImage } from "@/lib/feed-storage";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function failure(error: unknown) {
  const status = error instanceof FeedAuthError
    ? error.status
    : error instanceof Error && /Images must be|Image file is empty|Image is too large/.test(error.message)
      ? 400
      : 500;
  return NextResponse.json({ error: error instanceof Error ? error.message : "Public news request failed." }, { status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await requireFeedViewer();
    if (viewer.role !== Role.ADMIN) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const { id } = await context.params;
    const existing = await prisma.publicNewsPost.findUnique({ where: { id }, select: { imagePath: true } });
    if (!existing) return NextResponse.json({ error: "News post not found." }, { status: 404 });
    const formData = await request.formData();
    const data: { title?: string; content?: string | null; published?: boolean; imagePath?: string; imageMimeType?: string } = {};
    const title = formData.get("title");
    const content = formData.get("content");
    const published = formData.get("published");
    if (typeof title === "string") data.title = title.trim();
    if (typeof content === "string") data.content = content.trim() || null;
    if (published === "true" || published === "false") data.published = published === "true";
    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      const uploaded = await uploadFeedImage(image, PUBLIC_NEWS_BUCKET, "public");
      data.imagePath = uploaded.objectPath;
      data.imageMimeType = image.type;
      if (existing.imagePath) await deleteFeedImage(PUBLIC_NEWS_BUCKET, existing.imagePath);
    }
    const post = await prisma.publicNewsPost.update({ where: { id }, data });
    return NextResponse.json({ post });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE() {
  try {
    const viewer = await requireFeedViewer();
    if (viewer.role !== Role.ADMIN) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    return NextResponse.json(
      { error: "Permanent deletion is disabled. Use edit, unpublish, deactivate, or archive instead." },
      { status: 409 },
    );
  } catch (error) {
    return failure(error);
  }
}
