import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";
import OfficialFeedClient from "@/components/feed/OfficialFeedClient";

export const dynamic = "force-dynamic";

export default async function MobileOfficialFeedPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);
  return (
    <div className="space-y-4">
      <Link href="/mobile/official" className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
      <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-xl"><p className="text-[11px] uppercase tracking-[0.16em] text-accent">Municipal SK Federation Feed</p><h1 className="mt-1 text-xl font-bold text-foreground">Municipal SK Federation Feed</h1><p className="mt-1 text-sm text-muted">Admin and eligible Staff updates for your municipality.</p></section>
      <OfficialFeedClient />
    </div>
  );
}