import { useEffect } from "react";
import { useLocation } from "wouter";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

/** Fires a lightweight POST /api/track on every route change. Fire-and-forget. */
export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    fetch(`${BASE}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location }),
    }).catch(() => {});
  }, [location]);
}
