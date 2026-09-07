"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribeToConnectionStatus(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getConnectionStatus() {
  return navigator.onLine;
}

function getServerConnectionStatus() {
  return true;
}

export default function MobileOfflineNotice() {
  const online = useSyncExternalStore(
    subscribeToConnectionStatus,
    getConnectionStatus,
    getServerConnectionStatus,
  );

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
