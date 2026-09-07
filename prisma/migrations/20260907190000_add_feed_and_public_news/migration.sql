-- CreateEnum
CREATE TYPE "FeedReactionType" AS ENUM ('LIKE', 'HEART', 'SUPPORT');

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "imagePath" TEXT,
    "imageMimeType" TEXT,
    "authorId" TEXT NOT NULL,
    "municipalityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "FeedReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicNewsPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "imagePath" TEXT,
    "imageMimeType" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicNewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedPost_municipalityId_createdAt_idx" ON "FeedPost"("municipalityId", "createdAt");
CREATE INDEX "FeedPost_authorId_createdAt_idx" ON "FeedPost"("authorId", "createdAt");
CREATE UNIQUE INDEX "FeedReaction_postId_userId_key" ON "FeedReaction"("postId", "userId");
CREATE INDEX "FeedReaction_userId_createdAt_idx" ON "FeedReaction"("userId", "createdAt");
CREATE INDEX "FeedComment_postId_createdAt_idx" ON "FeedComment"("postId", "createdAt");
CREATE INDEX "FeedComment_userId_createdAt_idx" ON "FeedComment"("userId", "createdAt");
CREATE INDEX "PublicNewsPost_published_createdAt_idx" ON "PublicNewsPost"("published", "createdAt");
CREATE INDEX "PublicNewsPost_authorId_createdAt_idx" ON "PublicNewsPost"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedReaction" ADD CONSTRAINT "FeedReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedReaction" ADD CONSTRAINT "FeedReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicNewsPost" ADD CONSTRAINT "PublicNewsPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
