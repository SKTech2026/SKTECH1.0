import { getServerSession } from "next-auth";

import ChatClient from "@/components/chat/ChatClient";
import { authOptions } from "@/lib/auth";
import { requireOfficialFeatureAccess } from "@/lib/roleGuard";

export const dynamic = "force-dynamic";

export default async function MobileOfficialChatPage() {
  const session = await getServerSession(authOptions);
  await requireOfficialFeatureAccess(session);

  return <ChatClient title="Official Chat" compact />;
}
