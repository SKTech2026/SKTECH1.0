import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ChatClient from "@/components/chat/ChatClient";
import { authOptions } from "@/lib/auth";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialChatPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);

  return (
    <div className="space-y-3">
      <Link
        href="/mobile/official"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-300/25 bg-slate-900/80 px-3 text-sm font-semibold text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <ChatClient title="Official Chat" compact />
    </div>
  );
}
