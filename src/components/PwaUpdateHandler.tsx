"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "sktech.sw-reload-in-progress";

export default function PwaUpdateHandler() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const reloadOnce = () => {
      if (window.sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return;
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      window.location.reload();
    };

    const handleControllerChange = () => reloadOnce();
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const updateRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        void registration.update();

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch {
        // Service worker updates are best-effort and must not block the app.
      }
    };

    if (window.sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") {
      window.sessionStorage.removeItem(RELOAD_GUARD_KEY);
    }
    void updateRegistration();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
