import type { ReactNode } from "react";

import MobileOfflineNotice from "@/components/mobile/MobileOfflineNotice";
import MobileTopBar from "@/components/mobile/MobileTopBar";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 0px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
      }}
    >
      <MobileTopBar />
      <MobileOfflineNotice />
      <main className="mx-auto w-full max-w-md px-3 pb-6 pt-3">{children}</main>
    </div>
  );
}
