"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { translate } from "@/lib/i18n/dictionary";
import { isDashboardLanguage, LANGUAGE_STORAGE_KEY, type DashboardLanguage } from "@/lib/i18n/languages";

const CHANGE_EVENT = "sktech.dashboard.language.change";
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
};
const getSnapshot = (): DashboardLanguage => {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isDashboardLanguage(stored) ? stored : "en";
};
const getServerSnapshot = (): DashboardLanguage => "en";

type LanguageContextValue = {
  language: DashboardLanguage;
  setLanguage: (language: DashboardLanguage) => void;
  t: (key: string) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setLanguage = (next: DashboardLanguage) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };
  return <LanguageContext.Provider value={{ language, setLanguage, t: (key) => translate(language, key) }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
