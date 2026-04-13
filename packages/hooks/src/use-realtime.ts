"use client";

import { create } from "zustand";
import { getBackoffDelay } from "@jungle/utils";

export type WSEventType =
  | "connected"
  | "pong"
  | "message.new"
  | "notification.new"
  | "presence.online"
  | "presence.offline"
  | "typing.start"
  | "typing.stop"
  | "call.incoming"
  | "call_offer"
  | "call_answer"
  | "call_ice_candidate"
  | "call_end"
  | "post.new";

export interface WSEvent {
  type: WSEventType;
  data: unknown;
}

type EventHandler = (data: unknown) => void;

interface RealtimeState {
  socket: WebSocket | null;
  isConnected: boolean;
  unreadMessages: number;
  unreadNotifications: number;
  onlineUsers: Set<number>;
  typingUsers: Map<number, number[]>;

  connect: (token: string, wsUrl?: string) => void;
  disconnect: () => void;
  send: (event: string, data: unknown) => void;
  on: (event: WSEventType, handler: EventHandler) => () => void;
  incrementUnreadMessages: () => void;
  resetUnreadMessages: () => void;
  incrementUnreadNotifications: () => void;
  resetUnreadNotifications: () => void;
}

const handlers = new Map<WSEventType, Set<EventHandler>>();
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  socket: null,
  isConnected: false,
  unreadMessages: 0,
  unreadNotifications: 0,
  onlineUsers: new Set(),
  typingUsers: new Map(),

  connect: (token, wsUrl) => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) return;

    const url = wsUrl ?? (process.env["NEXT_PUBLIC_WS_URL"] ?? "ws://localhost:8080/ws");
    const ws = new WebSocket(`${url}?token=${token}`);

    ws.onopen = () => {
      reconnectAttempt = 0;
      set({ isConnected: true, socket: ws });
    };

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string) as { type?: string; event?: string; data: unknown };
        const msg: WSEvent = { type: (raw.type ?? raw.event ?? "") as WSEventType, data: raw.data };
        const eventHandlers = handlers.get(msg.type);
        eventHandlers?.forEach((h) => h(msg.data));

        // Built-in state updates
        if (msg.type === "message.new") {
          set((s) => ({ unreadMessages: s.unreadMessages + 1 }));
        } else if (msg.type === "notification.new") {
          set((s) => ({ unreadNotifications: s.unreadNotifications + 1 }));
        } else if (msg.type === "presence.online") {
          const userId = (msg.data as { user_id: number }).user_id;
          set((s) => {
            const next = new Set(s.onlineUsers);
            next.add(userId);
            return { onlineUsers: next };
          });
        } else if (msg.type === "presence.offline") {
          const userId = (msg.data as { user_id: number }).user_id;
          set((s) => {
            const next = new Set(s.onlineUsers);
            next.delete(userId);
            return { onlineUsers: next };
          });
        } else if (msg.type === "typing.start") {
          const { conversation_id, user_id } = msg.data as { conversation_id: number; user_id: number };
          set((s) => {
            const next = new Map(s.typingUsers);
            const users = next.get(conversation_id) ?? [];
            if (!users.includes(user_id)) next.set(conversation_id, [...users, user_id]);
            return { typingUsers: next };
          });
        } else if (msg.type === "typing.stop") {
          const { conversation_id, user_id } = msg.data as { conversation_id: number; user_id: number };
          set((s) => {
            const next = new Map(s.typingUsers);
            const users = (next.get(conversation_id) ?? []).filter((id) => id !== user_id);
            next.set(conversation_id, users);
            return { typingUsers: next };
          });
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      set({ isConnected: false, socket: null });
      const delay = getBackoffDelay(reconnectAttempt++);
      reconnectTimer = setTimeout(() => {
        get().connect(token, wsUrl);
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };

    set({ socket: ws });
  },

  disconnect: () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectAttempt = 0;
    const { socket } = get();
    socket?.close();
    set({
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: new Map(),
    });
  },

  send: (event, data) => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: event, data }));
    }
  },

  on: (event, handler) => {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler);
    return () => handlers.get(event)?.delete(handler);
  },

  incrementUnreadMessages: () =>
    set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
  resetUnreadMessages: () => set({ unreadMessages: 0 }),
  incrementUnreadNotifications: () =>
    set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
  resetUnreadNotifications: () => set({ unreadNotifications: 0 }),
}));
