import { NextResponse } from "next/server";

import { downloadFeedImage, PUBLIC_NEWS_BUCKET } from "@/lib/feed-storage";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const post = await prisma.publicNewsPost.findFirst({ where: { id, published: true }, select: { imagePath: true, imageMimeType: true } });
  if (!post?.imagePath) return NextResponse.json({ error: "Image not found." }, { status: 404 });
  try {
    const image = await downloadFeedImage(PUBLIC_NEWS_BUCKET, post.imagePath);
    return new NextResponse(image, { headers: { "Content-Type": post.imageMimeType ?? "image/webp", "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
