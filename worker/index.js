/* Added to next-pwa's generated service worker at build time. */
const notificationCopy = {
  announcement: { title: "SKTECH Announcement", body: "A new announcement is available in SKTECH." },
  chat: { title: "SKTECH Chat", body: "You have a new message." },
  kkProfile: { title: "SKTECH Profile Update", body: "A profile update is available in SKTECH." },
  certificate: { title: "SKTECH Certificate", body: "A certificate update is available in SKTECH." },
  admission: { title: "SKTECH Admission", body: "An admission update is available in SKTECH." },
  system: { title: "SKTECH System Alert", body: "A system update is available in SKTECH." },
  security: { title: "SKTECH Security Alert", body: "A security alert is available in SKTECH." },
  update: { title: "SKTECH Notification", body: "You have a new update in SKTECH." },
};
const notificationPaths = new Set([
  "/",
  "/dashboard",
  "/dashboard/staff/announcements",
  "/dashboard/official/announcements",
  "/dashboard/staff/chat",
  "/dashboard/official/chat",
]);

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { /* Use generic safe copy. */ }
  if (!payload || typeof payload !== "object") payload = {};
  const kind = Object.hasOwn(notificationCopy, payload.kind) ? payload.kind : "update";
  const url = notificationPaths.has(payload.url) ? payload.url : "/dashboard";
  event.waitUntil(self.registration.showNotification(notificationCopy[kind].title, {
    body: notificationCopy[kind].body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: kind === "chat" ? "sktech-chat" : kind === "announcement" ? "sktech-announcement" : "sktech-update",
    data: { url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const path = notificationPaths.has(event.notification.data?.url) ? event.notification.data.url : "/dashboard";
    const target = new URL(path, self.location.origin).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  })());
});
