"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore, useRealtimeStore } from "@jungle/hooks";

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { connect, disconnect } = useRealtimeStore();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect(accessToken);
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [isAuthenticated, accessToken, connect, disconnect]);

  return <>{children}</>;
}
