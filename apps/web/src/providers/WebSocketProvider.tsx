"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore, useRealtimeStore } from "@jungle/hooks";

export function WebSocketProvider({ children }: { children: ReactNode }) {
 const { accessToken, isAuthenticated, user, setUser } = useAuthStore();
 const { connect, disconnect, on, setViewerUserId, clearOpenMessageThreads } = useRealtimeStore();

 useEffect(() => {
 setViewerUserId(user?.id ?? null);
 if (!user) clearOpenMessageThreads();
 }, [user?.id, setViewerUserId, clearOpenMessageThreads]);

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

 // Cross-session profile sync: when this user mutates their avatar or
 // display name from another tab/device, the server fans the change out
 // through user.avatar_changed / user.name_changed; we mirror it into the
 // auth store so menus, headers and avatars update without a refresh.
 useEffect(() => {
 if (!user) return;
 const offAvatar = on<{ user_id: number; url: string }>("user.avatar_changed", (payload) => {
 if (payload.user_id !== user.id) return;
 const current = useAuthStore.getState().user;
 if (!current) return;
 setUser({ ...current, avatar: payload.url });
 });
 const offName = on<{ user_id: number; first_name: string; last_name: string }>(
 "user.name_changed",
 (payload) => {
 if (payload.user_id !== user.id) return;
 const current = useAuthStore.getState().user;
 if (!current) return;
 setUser({
 ...current,
 first_name: payload.first_name,
 last_name: payload.last_name,
 });
 },
 );
 return () => {
 offAvatar();
 offName();
 };
 }, [user, on, setUser]);

 return <>{children}</>;
}
