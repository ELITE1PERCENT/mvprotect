import { useState, useEffect } from "react";
import { checkAuth } from "@/lib/adminApi";

export type AuthState = "loading" | "authenticated" | "unauthenticated";

/**
 * Checks if the current session has a valid admin JWT cookie.
 * Returns the auth state: 'loading' | 'authenticated' | 'unauthenticated'
 */
export function useAdminAuth(): AuthState {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    let cancelled = false;
    checkAuth()
      .then(() => {
        if (!cancelled) setState("authenticated");
      })
      .catch(() => {
        if (!cancelled) setState("unauthenticated");
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
