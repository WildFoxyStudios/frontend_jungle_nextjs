"use client";
import { useRealtimeStore } from "./use-realtime";
export function usePresence(userId) {
    return useRealtimeStore((s) => s.onlineUsers.has(userId));
}
export function useOnlineUsers() {
    const onlineUsers = useRealtimeStore((s) => s.onlineUsers);
    // Return a snapshot to prevent accidental mutation of the store's Set
    return new Set(onlineUsers);
}
//# sourceMappingURL=use-presence.js.map