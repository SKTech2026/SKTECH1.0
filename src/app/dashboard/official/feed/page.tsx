import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function OfficialMunicipalFeedPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);
  const official = await prisma.sKOfficial.findUnique({
    where: { userId: session!.user.id },
    select: { municipalityId: true, municipality: true },
  });
  const posts = official?.municipalityId
    ? await prisma.event.findMany({
        where: { municipalityId: official.municipalityId },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: 50,
        select: { id: true, title: true, description: true, eventDate: true, createdAt: true, createdBy: { select: { name: true, email: true, role: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-xl backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Municipal SK Federation Feed</p>
        <h1 className="mt-3 text-3xl font-black text-foreground">Municipal SK Federation Feed</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Staff announcements for {official?.municipality ?? "your municipality"}, newest first.</p>
      </section>
      <section className="space-y-4">
        {posts.length === 0 ? <article className="rounded-2xl border border-dashed border-glass-border bg-surface p-5 text-sm text-muted">No municipal posts yet.</article> : posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-glass-border bg-surface p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{post.createdBy?.name ?? "Municipal Staff"}</p><h2 className="mt-2 text-xl font-bold text-foreground">{post.title}</h2></div><time className="text-right text-xs text-muted">{post.createdAt.toLocaleDateString()}</time></div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{post.description ?? "No additional details."}</p>
          </article>
        ))}
      </section>
    </div>
  );
}