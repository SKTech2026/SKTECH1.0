"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileOfflineNotice() {
  const [online, setOnline] = useState(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div
      className={`mx-3 mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
        online
          ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
          : "border-amber-400/35 bg-amber-500/10 text-amber-200"
      }`}
    >
      {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {online ? "Online mode: live verification ready." : "Offline mode: reconnect to verify and sync attendance."}
    </div>
  );
}
