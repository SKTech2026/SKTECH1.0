import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import ChatClient from "@/components/chat/ChatClient";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileStaffChatPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.STAFF]);

  return (
    <div className="space-y-4">
      <Link
        href="/mobile/staff"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-surface px-3 text-sm font-semibold text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Staff Mobile Dashboard
      </Link>
      <ChatClient title="Staff Chat" compact />
    </div>
  );
}
