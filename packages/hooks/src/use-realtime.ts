"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { getBackoffDelay } from "@jungle/utils";

/**
 * Wire-format events emitted by the realtime-service.
 * Every entry corresponds to a `WsMessage.event` produced either by
 * `event_consumer.rs::relay_event_to_ws` (NATS → WS fan-out) or by
 * `handlers/ws.rs::process_client_message` (peer-to-peer signaling /
 * typing echo).
 */
export type WSEventType =
  // ── Lifecycle ──
  | "connected"
  | "pong"
  // ── Messaging ──
  | "message.new"
  | "message.seen"
  | "message.typing.start"
  | "message.typing.stop"
  // ── Legacy typing aliases still emitted by the WS process_client_message path ──
  | "typing.start"
  | "typing.stop"
  // ── Notifications ──
  | "notification.new"
  | "notification.counter"
  // ── Calls ──
  | "call.incoming"
  | "call.answered"
  | "call.ended"
  | "call_offer"
  | "call_answer"
  | "call_ice_candidate"
  | "call_end"
  // ── Presence + profile mutations ──
  | "user.presence"
  | "user.avatar_changed"
  | "user.name_changed"
  // ── Social ──
  | "follow.requested"
  | "follow.request_cancelled"
  // ── Chat customization ──
  | "conversation.color_changed"
  // ── Feed granular ──
  | "post.reaction.added"
  | "post.new"
  | "comment.new"
  // ── Live ──
  | "live.started"
  | "live.ended"
  // ── Admin ──
  | "admin.notice";

export interface WSEvent<T = unknown> {
  type: WSEventType;
  data: T;
}

type EventHandler<T = unknown> = (data: T) => void;

export interface ProfileSnapshot {
  avatar?: string;
  first_name?: string;
  last_name?: string;
}

interface RealtimeState {
  // Connection
  socket: WebSocket | null;
  isConnected: boolean;

  /** Logged-in user; used to avoid counting our own outgoing messages as unread. */
  viewerUserId: number | null;
  /** Conversations with an open thread UI (full window or floating bubble). */
  openMessageThreadIds: Set<number>;

  // Counters (driven by `notification.counter` + new-message/notif events)
  unreadMessages: number;
  unreadNotifications: number;

  // Live presence + typing
  onlineUsers: Set<number>;
  /** conversationId → array of user_ids currently typing in that conversation */
  typingUsers: Map<number, number[]>;

  // Cross-session profile mirror (avatar / name fan-out from
  // `user.avatar_changed` and `user.name_changed`).
  profileVersions: Map<number, ProfileSnapshot>;

  // Granular feed signals
  /** feed_scope → number of new posts queued behind the banner */
  newPostsByScope: Map<string, number>;

  // Topic subscription bookkeeping for reconnect
  subscribedTopics: Set<string>;

  connect: (token: string, wsUrl?: string) => void;
  disconnect: () => void;
  send: (event: string, data: unknown) => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;

  on: <T = unknown>(event: WSEventType, handler: EventHandler<T>) => () => void;

  incrementUnreadMessages: () => void;
  resetUnreadMessages: () => void;
  incrementUnreadNotifications: () => void;
  resetUnreadNotifications: () => void;
  resetNewPosts: (scope: string) => void;

  setViewerUserId: (id: number | null) => void;
  registerOpenMessageThread: (conversationId: number) => void;
  unregisterOpenMessageThread: (conversationId: number) => void;
  clearOpenMessageThreads: () => void;
}

const handlers = new Map<WSEventType, Set<EventHandler>>();
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lastConnectArgs: { token: string; wsUrl?: string | undefined } | null = null;
/** After sleep / background tab WS can be CLOSED while `lastConnectArgs` still holds credentials. */
let visibilityWakeBound = false;

function bindVisibilityWakeReconnect(): void {
  if (typeof document === "undefined" || visibilityWakeBound) return;
  visibilityWakeBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const { socket } = useRealtimeStore.getState();
    const dead =
      !socket ||
      socket.readyState === WebSocket.CLOSING ||
      socket.readyState === WebSocket.CLOSED;
    if (!dead || !lastConnectArgs) return;
    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    useRealtimeStore.getState().connect(lastConnectArgs.token, lastConnectArgs.wsUrl);
  });
}

function toWsProtocol(protocol: string): "ws:" | "wss:" {
  return protocol === "https:" ? "wss:" : "ws:";
}

function normalizeWsBase(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("ws://") || value.startsWith("wss://")) {
    return value.replace(/\/+$/, "");
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const url = new URL(value);
    url.protocol = toWsProtocol(url.protocol);
    return url.toString().replace(/\/+$/, "");
  }
  return value.replace(/\/+$/, "");
}

function deriveWsUrl(explicitUrl?: string): string {
  const fromArg = explicitUrl?.trim();
  if (fromArg) return normalizeWsBase(fromArg);

  const fromEnv = process.env["NEXT_PUBLIC_WS_URL"]?.trim();
  if (fromEnv) return normalizeWsBase(fromEnv);

  const fromApiEnv = process.env["NEXT_PUBLIC_API_URL"]?.trim();
  if (fromApiEnv) {
    // NEXT_PUBLIC_API_URL can be absolute (https://api.example.com/api) or
    // relative (/api). Both should resolve to a WS endpoint at /ws.
    try {
      const base =
        fromApiEnv.startsWith("http://") ||
        fromApiEnv.startsWith("https://") ||
        fromApiEnv.startsWith("ws://") ||
        fromApiEnv.startsWith("wss://")
          ? new URL(fromApiEnv)
          : typeof window !== "undefined"
            ? new URL(fromApiEnv, window.location.origin)
            : null;
      if (base) {
        base.protocol = toWsProtocol(base.protocol);
        base.pathname = "/ws";
        base.search = "";
        base.hash = "";
        let out = base.toString().replace(/\/+$/, "");
        // Next.js dev (:3000) proxies /api but does not host the WS upgrade; gateway is typically :8080.
        if (typeof window !== "undefined" && window.location.port === "3000") {
          try {
            const u = new URL(out);
            if (
              (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
              (u.port === "3000" || u.port === "")
            ) {
              u.port = "8080";
              out = u.toString().replace(/\/+$/, "");
            }
          } catch {
            /* ignore */
          }
        }
        return out;
      }
    } catch {
      // Fall through to same-origin/default.
    }
  }

  if (typeof window !== "undefined") {
    return `${toWsProtocol(window.location.protocol)}//${window.location.host}/ws`;
  }

  return "ws://localhost:8080/ws";
}

function dispatch<T>(type: WSEventType, data: T) {
  const set = handlers.get(type);
  if (!set) return;
  for (const h of set) {
    try {
      (h as EventHandler<T>)(data);
    } catch (err) {
      // A failing handler must never break the dispatcher.
      // eslint-disable-next-line no-console
      console.error(`[realtime] handler for ${type} threw`, err);
    }
  }
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  socket: null,
  isConnected: false,
  viewerUserId: null,
  openMessageThreadIds: new Set(),
  unreadMessages: 0,
  unreadNotifications: 0,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  profileVersions: new Map(),
  newPostsByScope: new Map(),
  subscribedTopics: new Set(),

  connect: (token, wsUrl) => {
    lastConnectArgs = { token, wsUrl };
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const baseUrl = deriveWsUrl(wsUrl);
    const target = new URL(baseUrl);
    target.searchParams.set("token", token);
    const ws = new WebSocket(target.toString());

    ws.onopen = () => {
      reconnectAttempt = 0;
      bindVisibilityWakeReconnect();
      set({ isConnected: true, socket: ws });
      // Re-subscribe to every topic the app cared about before reconnect.
      const { subscribedTopics } = get();
      for (const topic of subscribedTopics) {
        ws.send(JSON.stringify({ event: "subscribe", data: { topic } }));
      }
    };

    ws.onmessage = (event) => {
      let raw: { type?: string; event?: string; data: unknown };
      try {
        raw = JSON.parse(event.data as string) as typeof raw;
      } catch {
        return;
      }
      const type = (raw.type ?? raw.event ?? "") as WSEventType;
      if (!type) return;
      const data = raw.data;

      // Built-in state updates first so subscribers see consistent state.
      applyBuiltinStateUpdate(type, data, set, get);

      // Fan out to user-registered handlers.
      dispatch(type, data);
    };

    ws.onclose = () => {
      set({ isConnected: false, socket: null });
      if (lastConnectArgs) {
        const delay = getBackoffDelay(reconnectAttempt++);
        reconnectTimer = setTimeout(() => {
          const args = lastConnectArgs;
          if (args) get().connect(args.token, args.wsUrl);
        }, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    set({ socket: ws });
  },

  disconnect: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    reconnectAttempt = 0;
    lastConnectArgs = null;
    handlers.clear();
    visibilityWakeBound = false;
    const { socket } = get();
    socket?.close();
    set({
      socket: null,
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: new Map(),
      profileVersions: new Map(),
      newPostsByScope: new Map(),
      subscribedTopics: new Set(),
    });
  },

  send: (event, data) => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      // Backend WsMessage shape is `{ event, data }`; we mirror `type` for
      // legacy consumers that sniff the outbound frame, the server ignores
      // unknown fields.
      socket.send(JSON.stringify({ event, type: event, data }));
    }
  },

  subscribe: (topic) => {
    const { subscribedTopics, socket } = get();
    if (subscribedTopics.has(topic)) return;
    const next = new Set(subscribedTopics);
    next.add(topic);
    set({ subscribedTopics: next });
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: "subscribe", data: { topic } }));
    }
  },

  unsubscribe: (topic) => {
    const { subscribedTopics, socket } = get();
    if (!subscribedTopics.has(topic)) return;
    const next = new Set(subscribedTopics);
    next.delete(topic);
    set({ subscribedTopics: next });
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: "unsubscribe", data: { topic } }));
    }
  },

  on: <T,>(event: WSEventType, handler: EventHandler<T>) => {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(handler as EventHandler);
    return () => handlers.get(event)?.delete(handler as EventHandler);
  },

  incrementUnreadMessages: () =>
    set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
  resetUnreadMessages: () => set({ unreadMessages: 0 }),
  incrementUnreadNotifications: () =>
    set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
  resetUnreadNotifications: () => set({ unreadNotifications: 0 }),
  resetNewPosts: (scope) => {
    const next = new Map(get().newPostsByScope);
    next.delete(scope);
    set({ newPostsByScope: next });
  },

  setViewerUserId: (id) => set({ viewerUserId: id }),

  registerOpenMessageThread: (conversationId) => {
    const next = new Set(get().openMessageThreadIds);
    next.add(conversationId);
    set({ openMessageThreadIds: next });
  },

  unregisterOpenMessageThread: (conversationId) => {
    const next = new Set(get().openMessageThreadIds);
    next.delete(conversationId);
    set({ openMessageThreadIds: next });
  },

  clearOpenMessageThreads: () => set({ openMessageThreadIds: new Set() }),
}));

/**
 * Centralised state mutations driven by incoming WS frames.
 * Kept out of the message handler body so the dispatcher stays compact and
 * each mutation is independently unit-testable.
 */
function applyBuiltinStateUpdate(
  type: WSEventType,
  data: unknown,
  set: (
    partial: Partial<RealtimeState> | ((s: RealtimeState) => Partial<RealtimeState>),
  ) => void,
  get: () => RealtimeState,
) {
  switch (type) {
    case "message.new": {
      const d = data as { conversation_id?: number; sender_id?: number };
      const { viewerUserId, openMessageThreadIds } = get();
      if (
        d.sender_id != null &&
        viewerUserId != null &&
        d.sender_id === viewerUserId
      ) {
        return;
      }
      if (
        d.conversation_id != null &&
        openMessageThreadIds.has(d.conversation_id)
      ) {
        return;
      }
      set((s) => ({ unreadMessages: s.unreadMessages + 1 }));
      return;
    }
    case "notification.new": {
      set((s) => ({ unreadNotifications: s.unreadNotifications + 1 }));
      return;
    }
    case "notification.counter": {
      const d = data as { messages?: number; notifications?: number };
      set({
        unreadMessages: d.messages ?? get().unreadMessages,
        unreadNotifications: d.notifications ?? get().unreadNotifications,
      });
      return;
    }
    case "user.presence": {
      const d = data as { user_id: number; status: "online" | "offline" };
      const next = new Set(get().onlineUsers);
      if (d.status === "online") next.add(d.user_id);
      else next.delete(d.user_id);
      set({ onlineUsers: next });
      return;
    }
    case "message.typing.start":
    case "typing.start": {
      const { conversation_id, user_id } = data as {
        conversation_id: number;
        user_id: number;
      };
      const next = new Map(get().typingUsers);
      const users = next.get(conversation_id) ?? [];
      if (!users.includes(user_id)) next.set(conversation_id, [...users, user_id]);
      set({ typingUsers: next });
      return;
    }
    case "message.typing.stop":
    case "typing.stop": {
      const { conversation_id, user_id } = data as {
        conversation_id: number;
        user_id: number;
      };
      const next = new Map(get().typingUsers);
      const users = (next.get(conversation_id) ?? []).filter((id) => id !== user_id);
      if (users.length === 0) next.delete(conversation_id);
      else next.set(conversation_id, users);
      set({ typingUsers: next });
      return;
    }
    case "user.avatar_changed": {
      const d = data as { user_id: number; url: string };
      const next = new Map(get().profileVersions);
      next.set(d.user_id, { ...(next.get(d.user_id) ?? {}), avatar: d.url });
      set({ profileVersions: next });
      return;
    }
    case "user.name_changed": {
      const d = data as { user_id: number; first_name: string; last_name: string };
      const next = new Map(get().profileVersions);
      next.set(d.user_id, {
        ...(next.get(d.user_id) ?? {}),
        first_name: d.first_name,
        last_name: d.last_name,
      });
      set({ profileVersions: next });
      return;
    }
    case "post.new": {
      const d = data as { feed_scope: string; count: number };
      const scope = d.feed_scope ?? "home";
      const next = new Map(get().newPostsByScope);
      next.set(scope, (next.get(scope) ?? 0) + (d.count ?? 1));
      set({ newPostsByScope: next });
      return;
    }
    default:
  }
}

/* ─────────────────────────────  Hooks  ───────────────────────────── */

/**
 * Declaratively subscribe to a realtime topic for the lifetime of the
 * component. Reconnects re-issue subscriptions automatically.
 */
export function useSubscribe(topic: string | null | undefined): void {
  useEffect(() => {
    if (!topic) return;
    const { subscribe, unsubscribe } = useRealtimeStore.getState();
    subscribe(topic);
    return () => unsubscribe(topic);
  }, [topic]);
}

/**
 * Subscribe an event handler to a specific WS event for the component
 * lifetime. The returned unsubscribe runs on unmount.
 */
export function useRealtimeEvent<T = unknown>(
  type: WSEventType,
  handler: EventHandler<T>,
): void {
  useEffect(() => {
    const off = useRealtimeStore.getState().on<T>(type, handler);
    return () => off();
  }, [type, handler]);
}

/** Latest avatar/name overrides for a given user, populated by WS fan-out. */
export function useProfileSnapshot(userId: number | null | undefined): ProfileSnapshot | undefined {
  return useRealtimeStore((s) =>
    userId == null ? undefined : s.profileVersions.get(userId),
  );
}

/** New-posts banner counter for a given feed scope (e.g. "home", "explore"). */
export function useNewPostsCount(scope: string): number {
  return useRealtimeStore((s) => s.newPostsByScope.get(scope) ?? 0);
}
