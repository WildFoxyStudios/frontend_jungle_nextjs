"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { getBackoffDelay } from "@jungle/utils";
const handlers = new Map();
let reconnectAttempt = 0;
let reconnectTimer = null;
let lastConnectArgs = null;
/** After sleep / background tab WS can be CLOSED while `lastConnectArgs` still holds credentials. */
let visibilityWakeBound = false;
function bindVisibilityWakeReconnect() {
    if (typeof document === "undefined" || visibilityWakeBound)
        return;
    visibilityWakeBound = true;
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible")
            return;
        const { socket } = useRealtimeStore.getState();
        const dead = !socket ||
            socket.readyState === WebSocket.CLOSING ||
            socket.readyState === WebSocket.CLOSED;
        if (!dead || !lastConnectArgs)
            return;
        reconnectAttempt = 0;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        useRealtimeStore.getState().connect(lastConnectArgs.token, lastConnectArgs.wsUrl);
    });
}
function toWsProtocol(protocol) {
    return protocol === "https:" ? "wss:" : "ws:";
}
function normalizeWsBase(raw) {
    const value = raw.trim();
    if (!value)
        return "";
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
function deriveWsUrl(explicitUrl) {
    const fromArg = explicitUrl?.trim();
    if (fromArg)
        return normalizeWsBase(fromArg);
    const fromEnv = process.env["NEXT_PUBLIC_WS_URL"]?.trim();
    if (fromEnv)
        return normalizeWsBase(fromEnv);
    const fromApiEnv = process.env["NEXT_PUBLIC_API_URL"]?.trim();
    if (fromApiEnv) {
        // NEXT_PUBLIC_API_URL can be absolute (https://api.example.com/api) or
        // relative (/api). Both should resolve to a WS endpoint at /ws.
        try {
            const base = fromApiEnv.startsWith("http://") ||
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
                        if ((u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
                            (u.port === "3000" || u.port === "")) {
                            u.port = "8080";
                            out = u.toString().replace(/\/+$/, "");
                        }
                    }
                    catch {
                        /* ignore */
                    }
                }
                return out;
            }
        }
        catch {
            // Fall through to same-origin/default.
        }
    }
    if (typeof window !== "undefined") {
        return `${toWsProtocol(window.location.protocol)}//${window.location.host}/ws`;
    }
    return "ws://localhost:8080/ws";
}
function dispatch(type, data) {
    const set = handlers.get(type);
    if (!set)
        return;
    for (const h of set) {
        try {
            h(data);
        }
        catch (err) {
            // A failing handler must never break the dispatcher.
            // eslint-disable-next-line no-console
            console.error(`[realtime] handler for ${type} threw`, err);
        }
    }
}
export const useRealtimeStore = create()((set, get) => ({
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
            let raw;
            try {
                raw = JSON.parse(event.data);
            }
            catch {
                return;
            }
            const type = (raw.type ?? raw.event ?? "");
            if (!type)
                return;
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
                    if (args)
                        get().connect(args.token, args.wsUrl);
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
        if (subscribedTopics.has(topic))
            return;
        const next = new Set(subscribedTopics);
        next.add(topic);
        set({ subscribedTopics: next });
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: "subscribe", data: { topic } }));
        }
    },
    unsubscribe: (topic) => {
        const { subscribedTopics, socket } = get();
        if (!subscribedTopics.has(topic))
            return;
        const next = new Set(subscribedTopics);
        next.delete(topic);
        set({ subscribedTopics: next });
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: "unsubscribe", data: { topic } }));
        }
    },
    on: (event, handler) => {
        if (!handlers.has(event))
            handlers.set(event, new Set());
        handlers.get(event).add(handler);
        return () => handlers.get(event)?.delete(handler);
    },
    incrementUnreadMessages: () => set((s) => ({ unreadMessages: s.unreadMessages + 1 })),
    resetUnreadMessages: () => set({ unreadMessages: 0 }),
    incrementUnreadNotifications: () => set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
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
function applyBuiltinStateUpdate(type, data, set, get) {
    switch (type) {
        case "message.new": {
            const d = data;
            const { viewerUserId, openMessageThreadIds } = get();
            if (d.sender_id != null &&
                viewerUserId != null &&
                d.sender_id === viewerUserId) {
                return;
            }
            if (d.conversation_id != null &&
                openMessageThreadIds.has(d.conversation_id)) {
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
            const d = data;
            set({
                unreadMessages: d.messages ?? get().unreadMessages,
                unreadNotifications: d.notifications ?? get().unreadNotifications,
            });
            return;
        }
        case "user.presence": {
            const d = data;
            const next = new Set(get().onlineUsers);
            if (d.status === "online")
                next.add(d.user_id);
            else
                next.delete(d.user_id);
            set({ onlineUsers: next });
            return;
        }
        case "message.typing.start":
        case "typing.start": {
            const { conversation_id, user_id } = data;
            const next = new Map(get().typingUsers);
            const users = next.get(conversation_id) ?? [];
            if (!users.includes(user_id))
                next.set(conversation_id, [...users, user_id]);
            set({ typingUsers: next });
            return;
        }
        case "message.typing.stop":
        case "typing.stop": {
            const { conversation_id, user_id } = data;
            const next = new Map(get().typingUsers);
            const users = (next.get(conversation_id) ?? []).filter((id) => id !== user_id);
            if (users.length === 0)
                next.delete(conversation_id);
            else
                next.set(conversation_id, users);
            set({ typingUsers: next });
            return;
        }
        case "user.avatar_changed": {
            const d = data;
            const next = new Map(get().profileVersions);
            next.set(d.user_id, { ...(next.get(d.user_id) ?? {}), avatar: d.url });
            set({ profileVersions: next });
            return;
        }
        case "user.name_changed": {
            const d = data;
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
            const d = data;
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
export function useSubscribe(topic) {
    useEffect(() => {
        if (!topic)
            return;
        const { subscribe, unsubscribe } = useRealtimeStore.getState();
        subscribe(topic);
        return () => unsubscribe(topic);
    }, [topic]);
}
/**
 * Subscribe an event handler to a specific WS event for the component
 * lifetime. The returned unsubscribe runs on unmount.
 */
export function useRealtimeEvent(type, handler) {
    useEffect(() => {
        const off = useRealtimeStore.getState().on(type, handler);
        return () => off();
    }, [type, handler]);
}
/** Latest avatar/name overrides for a given user, populated by WS fan-out. */
export function useProfileSnapshot(userId) {
    return useRealtimeStore((s) => userId == null ? undefined : s.profileVersions.get(userId));
}
/** New-posts banner counter for a given feed scope (e.g. "home", "explore"). */
export function useNewPostsCount(scope) {
    return useRealtimeStore((s) => s.newPostsByScope.get(scope) ?? 0);
}
//# sourceMappingURL=use-realtime.js.map