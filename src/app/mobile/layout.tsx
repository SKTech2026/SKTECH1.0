import type { ReactNode } from "react";
import { getServerSession } from "next-auth";

import MobileOfflineNotice from "@/components/mobile/MobileOfflineNotice";
import MobileTopBar from "@/components/mobile/MobileTopBar";
import { authOptions } from "@/lib/auth";
import SKTechAssistant from "@/components/assistant/SKTechAssistant";
import { normalizeRole } from "@/lib/assistant/sktech-help";

export default async function MobileLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const isOfficial = session?.user?.role === "OFFICIAL";
  const role = normalizeRole(session?.user?.role ? String(session.user.role) : null);

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 0px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
      }}
    >
      <MobileTopBar
        isOfficial={isOfficial}
        accountName={isOfficial ? session.user.name : undefined}
        accountEmail={isOfficial ? session.user.email : undefined}
        profileImageUrl={
          isOfficial && session.user.image?.startsWith("/") ? session.user.image : undefined
        }
      />
      <MobileOfflineNotice />
      <main className="mx-auto w-full max-w-md px-3 pb-6 pt-3">{children}</main>
      {role ? <SKTechAssistant role={role} /> : null}
    </div>
  );
}
