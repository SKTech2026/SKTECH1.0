import type { Prisma } from "@prisma/client";

export const feedPostInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      official: { select: { firstName: true, lastName: true, position: true, barangay: true, municipality: true } },
    },
  },
  municipality: { select: { id: true, name: true } },
  reactions: { select: { userId: true, type: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    take: 50,
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  },
} satisfies Prisma.FeedPostInclude;

export type FeedPostWithDetails = Prisma.FeedPostGetPayload<{ include: typeof feedPostInclude }>;

export function displayAuthor(author: FeedPostWithDetails["author"]) {
  if (author.official?.firstName && author.official.lastName) {
    return `${author.official.firstName} ${author.official.lastName}`;
  }
  return author.name || author.email || (author.role === "ADMIN" ? "SKTECH Admin" : "Municipal Staff");
}

export function serializeFeedPost(post: FeedPostWithDetails, viewerId: string) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imagePath ? `/api/feed/posts/${post.id}/image` : null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: post.author.id,
      name: displayAuthor(post.author),
      role: post.author.role,
      photoUrl: post.author.image?.startsWith("/") ? post.author.image : null,
      position: post.author.official?.position ?? null,
      barangay: post.author.official?.barangay ?? null,
      municipality: post.author.official?.municipality ?? post.municipality?.name ?? null,
    },
    municipality: post.municipality?.name ?? null,
    reactionCount: post.reactions.length,
    currentReaction: post.reactions.find((reaction) => reaction.userId === viewerId)?.type ?? null,
    comments: post.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.user.id,
        name: comment.user.name || comment.user.email || "SKTECH User",
        photoUrl: comment.user.image?.startsWith("/") ? comment.user.image : null,
      },
    })),
  };
}