import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import ChatClient from "@/components/chat/ChatClient";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialChatPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, [Role.OFFICIAL]);

  return <ChatClient title="Official Chat" compact />;
}
