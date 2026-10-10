export type VerificationType = "official" | "youthpass" | "certificate";

const ROUTES: Record<VerificationType, string> = {
  official: "/id",
  youthpass: "/kk/youthpass",
  certificate: "/kk/certificates",
};

const VERIFIED_PATH = /^\/(?:id|kk\/(?:youthpass|certificates))\/[A-Za-z0-9_-]+$/;
const RECORD_CODE = /^[A-Za-z0-9_-]+$/;
const PUBLIC_HOSTS = new Set([
  "sktech-ormin.com",
  "kk-portal.sktech-ormin.com",
  "kk.sktech-ormin.com",
]);

export function verificationTarget(input: string, type: VerificationType): string | null {
  const value = input.trim();
  if (!value || value.includes("\\")) return null;

  if (value.startsWith("/")) {
    if (value.startsWith("//")) return null;
    const path = value.split(/[?#]/, 1)[0];
    return VERIFIED_PATH.test(path) ? path : null;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const localDevelopment = process.env.NODE_ENV === "development" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1");
      if (!PUBLIC_HOSTS.has(url.hostname.toLowerCase()) && !localDevelopment) return null;
      if (url.username || url.password) return null;
      return VERIFIED_PATH.test(url.pathname) ? url.pathname : null;
    } catch {
      return null;
    }
  }

  return RECORD_CODE.test(value) ? `${ROUTES[type]}/${value}` : null;
}
