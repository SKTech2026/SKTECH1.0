"use client";

import { useEffect, useState } from "react";

function decodePublicKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const decoded = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export default function PushControls({ onUpdated }: { onUpdated: () => void }) {
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const available = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window && window.isSecureContext;
    setSupported(available);
    if (!available) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/notifications/push/subscribe", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { configured?: boolean; publicKey?: string | null };
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (!cancelled) {
          setConfigured(Boolean(data.configured));
          setPublicKey(data.publicKey ?? null);
          setSubscribed(Boolean(subscription));
        }
      } catch { /* In-app notifications remain available. */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const enable = async () => {
    if (!publicKey || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Browser permission was not granted. In-app notifications still work.");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("The PWA service worker is not ready. Reload the app and try again.");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodePublicKey(publicKey) });
      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error("Could not save the browser subscription.");
      }
      setSubscribed(true);
      setMessage("Browser alerts enabled for important SKTECH updates.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable browser alerts.");
    } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/notifications/push/unsubscribe", {
          method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) throw new Error("Could not disable browser alerts.");
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setMessage("Browser alerts disabled. In-app notifications remain available.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not disable browser alerts."); }
    finally { setBusy(false); }
  };

  const test = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/notifications/push/test", { method: "POST" });
      const data = await response.json() as { sent?: number; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not send a test alert.");
      setMessage(data.sent ? "Test alert sent to your subscribed browser." : "Test added in-app; no active browser subscription received push.");
      onUpdated();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not send a test alert."); }
    finally { setBusy(false); }
  };

  return (
    <div className="border-t border-glass-border px-4 py-3 text-xs text-muted">
      <p className="font-semibold text-foreground">Browser alerts</p>
      {!supported ? <p className="mt-1">Notifications are not supported on this browser.</p>
        : !configured ? <p className="mt-1">Browser alerts are not configured yet. In-app notifications still work.</p>
          : <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void (subscribed ? disable() : enable())} className="min-h-10 rounded-lg border border-accent/40 px-3 font-semibold text-accent disabled:opacity-50">{subscribed ? "Disable notifications" : "Enable notifications"}</button>
              {subscribed ? <button type="button" disabled={busy} onClick={() => void test()} className="min-h-10 rounded-lg border border-glass-border px-3 font-semibold text-foreground disabled:opacity-50">Send test</button> : null}
            </div>}
      {message ? <p role="status" className="mt-2 leading-5">{message}</p> : null}
    </div>
  );
}
