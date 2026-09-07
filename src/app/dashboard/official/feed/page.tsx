import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";
import OfficialFeedClient from "@/components/feed/OfficialFeedClient";

export const dynamic = "force-dynamic";

export default async function OfficialMunicipalFeedPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-glass-border bg-surface p-6 shadow-xl backdrop-blur-md sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Municipal SK Federation Feed</p>
        <h1 className="mt-3 text-3xl font-black text-foreground">Municipal SK Federation Feed</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Province-wide Admin updates and municipality-scoped Staff posts, with lightweight reactions and comments.</p>
      </section>
      <OfficialFeedClient />
    </div>
  );
}