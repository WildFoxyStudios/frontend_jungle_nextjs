"use client";

import { useEffect } from "react";
import { api } from "@jungle/api-client";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const encodedName = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(encodedName) || row.startsWith(`${name}=`));
  if (!match) return null;
  const raw = match.slice(match.indexOf("=") + 1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prefer canonical auth cookies shared with web app; fallback to admin token.
    const accessToken = readCookie("access_token") ?? readCookie("Jungle_admin_token");
    const refreshToken = readCookie("refresh_token");

    if (accessToken) {
      api.setToken(accessToken);
    }
    if (refreshToken) {
      api.setRefreshToken(refreshToken);
    }

    api.setOnAuthFailure(() => {
      if (typeof window === "undefined") return;
      if (!window.location.pathname.startsWith("/login")) {
        const redirect = encodeURIComponent(window.location.pathname || "/");
        window.location.href = `/login?redirect=${redirect}`;
      }
    });
  }, []);

  return <>{children}</>;
}
