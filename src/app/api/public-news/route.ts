import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await prisma.publicNewsPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, title: true, content: true, imagePath: true, imageMimeType: true, createdAt: true, author: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ posts: posts.map((post) => ({ id: post.id, title: post.title, content: post.content, createdAt: post.createdAt, imageUrl: post.imagePath ? `/api/public-news/${post.id}/image` : null, authorName: post.author.name || post.author.email || "SKTECH Admin" })) });
}
