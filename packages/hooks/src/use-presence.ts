"use client";

import { useRealtimeStore } from "./use-realtime";

export function usePresence(userId: number): boolean {
  return useRealtimeStore((s) => s.onlineUsers.has(userId));
}

export function useOnlineUsers(): Set<number> {
  const onlineUsers = useRealtimeStore((s) => s.onlineUsers);
  // Return a snapshot to prevent accidental mutation of the store's Set
  return new Set(onlineUsers);
}
