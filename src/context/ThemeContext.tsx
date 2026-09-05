"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

export type ThemeName =
  | "system"
  | "government-dark"
  | "emerald-authority"
  | "royal-purple"
  | "minimal-light"
  | "midnight-elite";

export type ThemePreset = {
  id: ThemeName;
  name: string;
  tagline: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "system",
    name: "System Default",
    tagline: "Follow the light or dark appearance selected by your device.",
  },
  {
    id: "government-dark",
    name: "Government Dark",
    tagline: "Navy governance surfaces with official blue highlights.",
  },
  {
    id: "emerald-authority",
    name: "Emerald Authority",
    tagline: "Deep emerald command palette for institutional clarity.",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    tagline: "High-contrast violet scheme for ceremonial dashboards.",
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    tagline: "Clean white interface with restrained gray accents.",
  },
  {
    id: "midnight-elite",
    name: "Midnight Elite",
    tagline: "Pure black cockpit with electric blue focal highlights.",
  },
];

const DEFAULT_THEME: ThemeName = "government-dark";
const STORAGE_KEY = "sktech.theme";
const THEME_CLASS_PREFIX = "theme-";
const ALL_THEME_CLASSES = THEME_PRESETS.map(
  (preset) => `${THEME_CLASS_PREFIX}${preset.id}`,
);

type ThemeContextValue = {
  theme: ThemeName;
  effectiveTheme: "dark" | "light";
  setTheme: (theme: ThemeName) => void;
  presets: ThemePreset[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeName = (value: string): value is ThemeName =>
  value === "system" || THEME_PRESETS.some((preset) => preset.id === value);

const applyThemeClass = (theme: ThemeName, systemTheme: "dark" | "light") => {
  const root = document.documentElement;
  root.classList.remove(...ALL_THEME_CLASSES);
  const effectiveTheme = theme === "system" ? systemTheme : theme === "minimal-light" ? "light" : "dark";
  root.classList.add(`${THEME_CLASS_PREFIX}${theme === "system" ? (effectiveTheme === "light" ? "minimal-light" : "government-dark") : theme}`);
  root.style.colorScheme = effectiveTheme;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeState, setThemeState] = useState({
    theme: DEFAULT_THEME,
    systemTheme: "dark" as "dark" | "light",
    hydrated: false,
  });

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const savedThemeName = savedTheme && isThemeName(savedTheme) ? savedTheme : DEFAULT_THEME;
    const systemTheme = mediaQuery.matches ? "light" : "dark";

    queueMicrotask(() => {
      setThemeState({
        theme: savedThemeName,
        systemTheme,
        hydrated: true,
      });
    });

    const updateSystemTheme = () => {
      setThemeState((current) => ({
        ...current,
        systemTheme: mediaQuery.matches ? "light" : "dark",
      }));
    };
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    if (!themeState.hydrated) return;
    applyThemeClass(themeState.theme, themeState.systemTheme);
    window.localStorage.setItem(STORAGE_KEY, themeState.theme);
  }, [themeState]);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    setThemeState((current) => ({ ...current, theme: nextTheme }));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeState.theme,
      effectiveTheme: themeState.theme === "system" ? themeState.systemTheme : themeState.theme === "minimal-light" ? "light" : "dark",
      setTheme,
      presets: THEME_PRESETS,
    }),
    [setTheme, themeState],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}
