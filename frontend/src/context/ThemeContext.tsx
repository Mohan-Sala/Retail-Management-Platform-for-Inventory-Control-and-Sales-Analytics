import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "@/lib/api";

type Theme = "light" | "dark" | "system";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } | null>(null);
const KEY = "shopsense.theme";

/**
 * @desc Coordinates light, dark, and system preferred theme contexts, persisting changes locally and syncing to profiles
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(KEY) as Theme | null)) || "system";
    setThemeState(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeTheme = theme;
      if (theme === "system") {
        activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      root.classList.toggle("dark", activeTheme === "dark");
    };

    applyTheme();

    let mediaQuery: MediaQueryList | null = null;
    let listener: (() => void) | null = null;

    if (theme === "system") {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
    }

    try {
      localStorage.setItem(KEY, theme);
    } catch {}

    return () => {
      if (mediaQuery && listener) {
        mediaQuery.removeEventListener("change", listener);
      }
    };
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    if (newTheme === theme) return;
    setThemeState(newTheme);
    try {
      await api.put("/profile", { theme: newTheme });
    } catch (e) {
      // Quietly ignore if profile update fails (unauthenticated state)
    }
  };

  const toggle = () => {
    // If current theme is system, toggle based on active calculated theme
    let activeTheme = theme;
    if (theme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    setTheme(activeTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
