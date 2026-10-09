export const MAIN_PUBLIC_URL = "https://sktech-ormin.com";
export const KK_PORTAL_PUBLIC_URL = "https://kk-portal.sktech-ormin.com";

export function kkInvitationUrl(path: string): string {
  if (!/^\/kk\/join\/[^/]+$/.test(path)) {
    throw new Error("Invalid KK invitation path.");
  }
  return `${KK_PORTAL_PUBLIC_URL}${path}`;
}
