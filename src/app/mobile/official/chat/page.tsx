import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import ChatClient from "@/components/chat/ChatClient";
import { authOptions } from "@/lib/auth";
import { requireDashboardRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialChatPage() {
  const session = await getServerSession(authOptions);
  requireDashboardRole(session, [Role.OFFICIAL], {
    unauthenticatedRedirect: "/official/auth",
    requireApproved: false,
  });

  return <ChatClient title="Official Chat" compact />;
}
