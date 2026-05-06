/**
 * Wire-format events emitted by the realtime-service.
 * Every entry corresponds to a `WsMessage.event` produced either by
 * `event_consumer.rs::relay_event_to_ws` (NATS → WS fan-out) or by
 * `handlers/ws.rs::process_client_message` (peer-to-peer signaling /
 * typing echo).
 */
export type WSEventType = "connected" | "pong" | "message.new" | "message.seen" | "message.typing.start" | "message.typing.stop" | "typing.start" | "typing.stop" | "notification.new" | "notification.counter" | "call.incoming" | "call.answered" | "call.ended" | "call_offer" | "call_answer" | "call_ice_candidate" | "call_end" | "user.presence" | "user.avatar_changed" | "user.name_changed" | "follow.requested" | "follow.request_cancelled" | "conversation.color_changed" | "post.reaction.added" | "post.new" | "comment.new" | "live.started" | "live.ended" | "admin.notice";
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
    socket: WebSocket | null;
    isConnected: boolean;
    /** Logged-in user; used to avoid counting our own outgoing messages as unread. */
    viewerUserId: number | null;
    /** Conversations with an open thread UI (full window or floating bubble). */
    openMessageThreadIds: Set<number>;
    unreadMessages: number;
    unreadNotifications: number;
    onlineUsers: Set<number>;
    /** conversationId → array of user_ids currently typing in that conversation */
    typingUsers: Map<number, number[]>;
    profileVersions: Map<number, ProfileSnapshot>;
    /** feed_scope → number of new posts queued behind the banner */
    newPostsByScope: Map<string, number>;
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
export declare const useRealtimeStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RealtimeState>>;
/**
 * Declaratively subscribe to a realtime topic for the lifetime of the
 * component. Reconnects re-issue subscriptions automatically.
 */
export declare function useSubscribe(topic: string | null | undefined): void;
/**
 * Subscribe an event handler to a specific WS event for the component
 * lifetime. The returned unsubscribe runs on unmount.
 */
export declare function useRealtimeEvent<T = unknown>(type: WSEventType, handler: EventHandler<T>): void;
/** Latest avatar/name overrides for a given user, populated by WS fan-out. */
export declare function useProfileSnapshot(userId: number | null | undefined): ProfileSnapshot | undefined;
/** New-posts banner counter for a given feed scope (e.g. "home", "explore"). */
export declare function useNewPostsCount(scope: string): number;
export {};
//# sourceMappingURL=use-realtime.d.ts.map