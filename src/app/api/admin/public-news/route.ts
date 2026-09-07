import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { requireFeedViewer, FeedAuthError } from "@/lib/feed-auth";
import { prisma } from "@/lib/db";
import { PUBLIC_NEWS_BUCKET, uploadFeedImage } from "@/lib/feed-storage";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  const status = error instanceof FeedAuthError
    ? error.status
    : error instanceof Error && /Images must be|Image file is empty|Image is too large/.test(error.message)
      ? 400
      : 500;
  return NextResponse.json({ error: error instanceof Error ? error.message : "Public news request failed." }, { status });
}

export async function GET() {
  try {
    const viewer = await requireFeedViewer();
    if (viewer.role !== Role.ADMIN) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const posts = await prisma.publicNewsPost.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { author: { select: { name: true, email: true } } } });
    return NextResponse.json({ posts: posts.map((post) => ({ ...post, imageUrl: post.imagePath ? `/api/public-news/${post.id}/image` : null })) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  let imagePath: string | null = null;
  try {
    const viewer = await requireFeedViewer();
    if (viewer.role !== Role.ADMIN) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    const formData = await request.formData();
    const title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
    const content = typeof formData.get("content") === "string" ? String(formData.get("content")).trim() : "";
    const published = formData.get("published") === "true";
    const image = formData.get("image");
    const file = image instanceof File && image.size > 0 ? image : null;
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (title.length > 180 || content.length > 5000) return NextResponse.json({ error: "News content is too long." }, { status: 400 });
    if (file) imagePath = (await uploadFeedImage(file, PUBLIC_NEWS_BUCKET, "public" )).objectPath;
    const post = await prisma.publicNewsPost.create({ data: { title, content: content || null, published, imagePath, imageMimeType: file?.type ?? null, authorId: viewer.userId } });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
