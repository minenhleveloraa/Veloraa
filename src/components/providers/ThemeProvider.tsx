"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  /**
   * `true` once the provider has read the user's stored preference on the
   * client. During SSR and the very first client render this is `false`, so
   * consumers can render a stable placeholder to avoid hydration mismatches.
   */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "light",
  toggle: () => {},
  mounted: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function readStoredTheme(fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem("veloraa-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage may be blocked (e.g. private mode); fall through.
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return fallback;
}

function writeThemeCookie(theme: Theme) {
  // 1 year, lax — read server-side by the root layout to apply `.dark` on <html>
  // during SSR, eliminating FOUC for returning users.
  document.cookie = `veloraa-theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export default function ThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  // Seed with the cookie-derived value resolved on the server. SSR and the
  // first client render produce the same HTML — no remount, no flash.
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // After mount, reconcile against localStorage / system preference. This
    // only matters on the very first visit (no cookie yet); afterwards the
    // cookie is the source of truth and matches `initialTheme`.
    const timeoutId = window.setTimeout(() => {
      const resolved = readStoredTheme(initialTheme);
      if (resolved !== initialTheme) setTheme(resolved);
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialTheme]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("veloraa-theme", theme);
    } catch {
      // Ignore — storage may be unavailable.
    }
    writeThemeCookie(theme);
  }, [theme, mounted]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
