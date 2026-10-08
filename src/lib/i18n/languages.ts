export type DashboardLanguage = "en" | "fil";

export const LANGUAGE_STORAGE_KEY = "sktech.dashboard.language";

export const isDashboardLanguage = (value: string | null): value is DashboardLanguage =>
  value === "en" || value === "fil";
