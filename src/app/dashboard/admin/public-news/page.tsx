import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import PublicNewsAdminClient from "@/components/feed/PublicNewsAdminClient";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function AdminPublicNewsPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.ADMIN]);
  return <div className="space-y-5"><section><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Public Landing Feed</p><h1 className="mt-2 text-3xl font-bold text-foreground">Public News Feed</h1><p className="mt-2 text-sm text-muted">Only published posts created here appear on the public SKTECH landing page.</p></section><PublicNewsAdminClient /></div>;
}