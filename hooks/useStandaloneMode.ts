"use client";

import { useState, useEffect, useMemo } from "react";

type DisplayMode = "browser" | "standalone" | "twa";

/**
 * Detects whether the app is running in standalone (installed PWA) mode.
 *
 * iOS Safari uses `navigator.standalone` (non-standard, Apple-only).
 * Android Chrome uses the CSS `display-mode: standalone` media query.
 * TWA (Trusted Web Activity) is detected via the `twa` display mode.
 */
export function useStandaloneMode(): {
  isStandalone: boolean;
  displayMode: DisplayMode;
} {
  // Initialize mode synchronously without setState
  const initialMode = useMemo<DisplayMode>(() => {
    if (typeof window === "undefined") return "browser";

    if (
      "standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone: boolean }).standalone
    ) {
      return "standalone";
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      return "standalone";
    }

    if (document.referrer.includes("android-app://")) {
      return "twa";
    }

    return "browser";
  }, []);

  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);

  useEffect(() => {
    // Only listen for display mode changes after initial render
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches && displayMode !== "standalone") {
        setDisplayMode("standalone");
      }
    };
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [displayMode]);

  return {
    isStandalone: displayMode === "standalone" || displayMode === "twa",
    displayMode,
  };
}
