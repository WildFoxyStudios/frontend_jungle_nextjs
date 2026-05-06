"use client";

import { useEffect } from "react";
import { usersApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";

/**
 * Keeps `is_admin` / `is_moderator` in the auth store aligned with the server.
 * Zustand-persisted sessions can miss role changes until re-login; the admin bar
 * and menu rely on these flags.
 */
export function useStaffFlagsSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!accessToken || userId == null) return;
    let cancelled = false;
    usersApi
      .getMe()
      .then((me) => {
        if (cancelled) return;
        const current = useAuthStore.getState().user;
        if (!current) return;
        const admin = Boolean(me.is_admin);
        const mod = Boolean(me.is_moderator);
        if (current.is_admin === admin && Boolean(current.is_moderator) === mod) return;
        setUser({ ...current, is_admin: admin, is_moderator: mod });
      })
      .catch(() => {
        /* non-critical */
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId, setUser]);
}
