"use client";

import { useRealtimeStore } from "./use-realtime";

export function usePresence(userId: number): boolean {
  return useRealtimeStore((s) => s.onlineUsers.has(userId));
}

export function useOnlineUsers(): Set<number> {
  return useRealtimeStore((s) => s.onlineUsers);
}
