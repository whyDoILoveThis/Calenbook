"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on the client side only.
 *
 * Why a dedicated component:
 * - "use client" ensures this never runs during SSR (no hydration mismatch)
 * - useEffect only fires after hydration is complete (browser-only)
 * - Keeps registration logic isolated from the root layout
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register SW in production — in dev it causes stale caches
    // that prevent code changes from appearing on refresh
    if (process.env.NODE_ENV !== "production") {
      // Unregister any existing SW from prior dev runs
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => {
            reg.unregister();
            console.log("[PWA] Unregistered dev SW:", reg.scope);
          });
        });
        // Clear all SW caches
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
            console.log("[PWA] Cleared cache:", name);
          });
        });
      }
      return;
    }

    if ("serviceWorker" in navigator) {
      // Register after the page has fully loaded to avoid competing
      // with critical resource downloads during initial page load
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[PWA] SW registered, scope:", registration.scope);

            // Check for updates periodically (every 60 minutes)
            setInterval(
              () => {
                registration.update();
              },
              60 * 60 * 1000,
            );
          })
          .catch((error) => {
            console.error("[PWA] SW registration failed:", error);
          });
      });
    }
  }, []);

  // This component renders nothing — it's purely a side-effect hook
  return null;
}
