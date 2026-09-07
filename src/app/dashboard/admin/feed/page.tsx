import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import InternalFeedComposer from "@/components/feed/InternalFeedComposer";
import OfficialFeedClient from "@/components/feed/OfficialFeedClient";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function AdminFeedPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);
  return <div className="space-y-5"><section><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Internal Governance Feed</p><h1 className="mt-2 text-3xl font-bold text-foreground">Admin and Staff Feed</h1><p className="mt-2 text-sm text-muted">Province-wide Admin updates and municipality-scoped Staff posts for eligible Officials.</p></section><InternalFeedComposer /><OfficialFeedClient canManage /></div>;
}