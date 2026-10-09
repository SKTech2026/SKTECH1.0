/* Added to next-pwa's generated service worker at build time. */
self.addEventListener("push", (event) => {
  // Keep lock-screen content generic even if a push service sends unexpected data.
  event.waitUntil(self.registration.showNotification("SKTECH Notification", {
    body: "You have a new update in SKTECH.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "sktech-update",
    data: { url: "/dashboard" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL("/dashboard", self.location.origin).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  })());
});
