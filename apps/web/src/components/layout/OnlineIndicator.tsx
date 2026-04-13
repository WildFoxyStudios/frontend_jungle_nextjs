"use client";

import { useRealtimeStore } from "@jungle/hooks";

interface OnlineIndicatorProps {
  userId: number;
  className?: string;
}

export function OnlineIndicator({ userId, className = "" }: OnlineIndicatorProps) {
  const { onlineUsers } = useRealtimeStore();
  const isOnline = onlineUsers.has(userId);

  if (!isOnline) return null;

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background ${className}`}
      aria-label="Online"
    />
  );
}
