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
  setTheme: (theme: ThemeName) => void;
  presets: ThemePreset[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeName = (value: string): value is ThemeName =>
  THEME_PRESETS.some((preset) => preset.id === value);

const resolveInitialTheme = (): ThemeName => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme && isThemeName(savedTheme)) {
    return savedTheme;
  }

  return DEFAULT_THEME;
};

const applyThemeClass = (theme: ThemeName) => {
  const root = document.documentElement;
  root.classList.remove(...ALL_THEME_CLASSES);
  root.classList.add(`${THEME_CLASS_PREFIX}${theme}`);
  root.style.colorScheme = theme === "minimal-light" ? "light" : "dark";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(resolveInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    setThemeState(nextTheme);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      presets: THEME_PRESETS,
    }),
    [setTheme, theme],
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
