"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const defaultPreferences = {
  pushChat: true,
  pushAnnouncements: true,
  pushKkProfile: true,
  pushCertificates: true,
  pushAdmissions: true,
  pushSystem: true,
};

type PreferenceKey = keyof typeof defaultPreferences;

const preferenceOptions: { key: PreferenceKey; label: string; detail: string }[] = [
  { key: "pushChat", label: "Chat messages", detail: "New messages in your conversations" },
  { key: "pushAnnouncements", label: "Announcements", detail: "New Events and published news" },
  { key: "pushKkProfile", label: "Profile updates", detail: "Updates to your KK profile" },
  { key: "pushCertificates", label: "Certificates", detail: "Certificate status and issuance" },
  { key: "pushAdmissions", label: "Admissions", detail: "Admission status updates" },
  { key: "pushSystem", label: "System alerts", detail: "Security alerts remain enabled" },
];

function decodePublicKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const decoded = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export default function PushControls({ onUpdated }: { onUpdated: () => void }) {
  const { t } = useLanguage();
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [savingPreference, setSavingPreference] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    const available = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window && window.isSecureContext;
    setSupported(available);
    let cancelled = false;
    void (async () => {
      try {
        const preferencesResponse = await fetch("/api/notifications/preferences", { cache: "no-store" });
        if (preferencesResponse.ok) {
          const data = await preferencesResponse.json() as { preferences?: Partial<typeof defaultPreferences> };
          if (!cancelled && data.preferences) setPreferences({ ...defaultPreferences, ...data.preferences });
        }
        if (!available) return;
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

  const updatePreference = async (key: PreferenceKey) => {
    if (savingPreference) return;
    const previous = preferences[key];
    const value = !previous;
    setPreferences((current) => ({ ...current, [key]: value }));
    setSavingPreference(key);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!response.ok) throw new Error("Could not update notification preferences.");
      const data = await response.json() as { preferences?: typeof defaultPreferences };
      if (data.preferences) setPreferences(data.preferences);
    } catch (error) {
      setPreferences((current) => ({ ...current, [key]: previous }));
      setMessage(error instanceof Error ? error.message : "Could not update notification preferences.");
    } finally { setSavingPreference(null); }
  };

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
      <p className="font-semibold text-foreground">{t("Browser alerts")}</p>
      {!supported ? <p className="mt-1">{t("Notifications are not supported on this browser.")}</p>
        : !configured ? <p className="mt-1">{t("Browser alerts are not configured yet. In-app notifications still work.")}</p>
          : <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void (subscribed ? disable() : enable())} className="min-h-10 rounded-lg border border-accent/40 px-3 font-semibold text-accent disabled:opacity-50">{t(subscribed ? "Disable notifications" : "Enable notifications")}</button>
              {subscribed ? <button type="button" disabled={busy} onClick={() => void test()} className="min-h-10 rounded-lg border border-glass-border px-3 font-semibold text-foreground disabled:opacity-50">{t("Send test")}</button> : null}
            </div>}
      <details className="mt-3 border-t border-glass-border pt-3">
        <summary className="min-h-10 cursor-pointer py-2 font-semibold text-foreground">{t("Notification preferences")}</summary>
        <p className="mb-2 leading-5">{t("These choices control browser push only. In-app notifications continue to work. Security alerts stay enabled.")}</p>
        <div className="divide-y divide-glass-border">
          {preferenceOptions.map(({ key, label, detail }) => (
            <div key={key} className="flex min-h-14 items-center justify-between gap-3 py-2">
              <span className="min-w-0"><span className="block font-semibold text-foreground">{t(label)}</span><span className="block text-[11px] leading-4">{t(detail)}</span></span>
              <button
                type="button"
                role="switch"
                aria-label={`${label} push notifications`}
                aria-checked={preferences[key]}
                disabled={savingPreference !== null}
                onClick={() => void updatePreference(key)}
                className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${preferences[key] ? "border-accent bg-accent" : "border-glass-border bg-surface-elevated"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${preferences[key] ? "translate-x-[1.35rem]" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </details>
      {message ? <p role="status" className="mt-2 leading-5">{t(message)}</p> : null}
    </div>
  );
}
