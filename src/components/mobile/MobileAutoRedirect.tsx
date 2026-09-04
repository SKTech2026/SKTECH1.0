"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type SessionResponse = {
  user?: {
    role?: string | null;
  } | null;
} | null;

const DESKTOP_OVERRIDE_KEY = "sktech.mobile.desktopOverride";
const PHONE_QUERY = "(max-width: 767px)";

const SKIPPED_PATH_PREFIXES = [
  "/api",
  "/_next",
  "/mobile",
  "/login",
  "/admin",
  "/official/auth",
  "/official/auth/register",
  "/official/auth/verify",
  "/role-selection",
  "/unauthorized",
  "/id",
];

function shouldSkipPath(pathname: string) {
  return SKIPPED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getMobileRoute(role: string | null | undefined) {
  if (role === "OFFICIAL") {
    return "/mobile/official";
  }

  if (role === "STAFF") {
    return "/mobile/staff-scanner";
  }

  return null;
}

export default function MobileAutoRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || shouldSkipPath(pathname)) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("desktop") === "1") {
      window.sessionStorage.setItem(DESKTOP_OVERRIDE_KEY, "1");
      return;
    }

    if (window.sessionStorage.getItem(DESKTOP_OVERRIDE_KEY) === "1") {
      return;
    }

    const mobileQuery = window.matchMedia(PHONE_QUERY);

    if (!mobileQuery.matches) {
      return;
    }

    const controller = new AbortController();

    async function redirectMobileUser() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const session = (await response.json()) as SessionResponse;
        const mobileRoute = getMobileRoute(session?.user?.role);

        if (mobileRoute && pathname !== mobileRoute) {
          router.replace(mobileRoute);
        }
      } catch {
        // Ignore transient session fetch failures; normal routing should continue.
      }
    }

    void redirectMobileUser();

    return () => controller.abort();
  }, [pathname, router]);

  return null;
}
