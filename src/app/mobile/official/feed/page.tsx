import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialFeedPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);
  const official = await prisma.sKOfficial.findUnique({ where: { userId: session!.user.id }, select: { municipalityId: true, municipality: true } });
  const posts = official?.municipalityId ? await prisma.event.findMany({ where: { municipalityId: official.municipalityId }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 50, select: { id: true, title: true, description: true, createdAt: true, createdBy: { select: { name: true } } } }) : [];

  return (
    <div className="space-y-4">
      <Link href="/mobile/official" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl"><p className="text-[11px] uppercase tracking-[0.16em] text-accent">Municipal SK Federation Feed</p><h1 className="mt-1 text-xl font-bold text-foreground">Municipal SK Federation Feed</h1><p className="mt-1 text-sm text-muted">Staff posts for {official?.municipality ?? "your municipality"}.</p></section>
      <section className="space-y-3">{posts.length === 0 ? <p className="rounded-2xl border border-dashed border-glass-border bg-surface p-4 text-sm text-muted">No municipal posts yet.</p> : posts.map((post) => <article key={post.id} className="rounded-2xl border border-glass-border bg-surface p-4 shadow-lg"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{post.createdBy?.name ?? "Municipal Staff"}</p><h2 className="mt-2 text-base font-bold text-foreground">{post.title}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{post.description ?? "No additional details."}</p><time className="mt-3 block text-xs text-muted">{post.createdAt.toLocaleString()}</time></article>)}</section>
    </div>
  );
}