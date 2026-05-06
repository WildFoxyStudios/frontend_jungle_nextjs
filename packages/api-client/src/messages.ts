import { api } from "./client";
import { normalizeConversation, normalizeConversationPage } from "./conversation-normalize";
import {
  normalizeMessagePage,
  normalizeMessageRow,
  normalizeSentMessagePayload,
} from "./message-normalize";
import type { Conversation, Gift, StickerPack, PaginatedResponse } from "./types/index";

export const messagesApi = {
  getConversations: (cursor?: string) =>
    api.get<PaginatedResponse<unknown>>("/v1/conversations", { cursor }).then(normalizeConversationPage),
  getPinnedConversations: () =>
    api.get<PaginatedResponse<unknown>>("/v1/conversations/pinned").then(normalizeConversationPage),
  getArchivedConversations: () =>
    api.get<PaginatedResponse<unknown>>("/v1/conversations/archived").then(normalizeConversationPage),
  getConversation: (id: number) =>
    api.get<unknown>(`/v1/conversations/${id}`).then((raw) => normalizeConversation(raw)),
  createConversation: (userId: number) =>
    api.post<unknown>("/v1/conversations", { user_id: userId }).then((raw) => normalizeConversation(raw)),
  createGroupConversation: (data: { name: string; member_ids: number[]; avatar?: string }) =>
    api.post<unknown>("/v1/conversations/group", data).then((raw) => normalizeConversation(raw)),
  updateGroupConversation: (id: number, data: { name?: string; avatar?: string }) =>
    api.put<unknown>(`/v1/conversations/group/${id}`, data).then((raw) => normalizeConversation(raw)),
  getMessages: (conversationId: number, cursor?: string) =>
    api
      .get<PaginatedResponse<unknown>>(`/v1/conversations/${conversationId}/messages`, { cursor })
      .then(normalizeMessagePage),
  sendMessage: (conversationId: number, data: { content?: string; type?: string; media_id?: number; sticker_id?: number; gift_id?: number; reply_to?: number }) => {
    const body: Record<string, unknown> = { ...data };
    if (data.reply_to != null) {
      body.reply_to_id = data.reply_to;
      delete body.reply_to;
    }
    if (data.type != null) {
      body.message_type = data.type;
      delete body.type;
    }
    return api
      .post<unknown>(`/v1/conversations/${conversationId}/messages`, body)
      .then(normalizeSentMessagePayload);
  },
  sendTypingIndicator: (conversationId: number) =>
    api.post<void>(`/v1/conversations/${conversationId}/typing`),
  stopTypingIndicator: (conversationId: number) =>
    api.post<void>(`/v1/conversations/${conversationId}/typing/stop`),
  deleteMessage: (id: number) => api.delete<void>(`/v1/messages/${id}`),
  forwardMessage: (messageId: number, conversationIds: number[]) =>
    api
      .post<unknown>(`/v1/messages/${messageId}/forward`, { conversation_ids: conversationIds })
      .then((raw) => {
        if (Array.isArray(raw)) return raw.map((x) => normalizeMessageRow(x));
        const r = raw as { data?: unknown[] };
        return Array.isArray(r?.data) ? r.data.map((x) => normalizeMessageRow(x)) : [];
      }),
  pinMessage: (id: number) => api.post<void>(`/v1/messages/${id}/pin`),
  unpinMessage: (id: number) => api.delete<void>(`/v1/messages/${id}/pin`),
  favoriteMessage: (id: number) => api.post<void>(`/v1/messages/${id}/favorite`),
  reactToMessage: (id: number, reaction: string) =>
    api.post<void>(`/v1/messages/${id}/react`, { reaction }),
  markListened: (id: number) => api.post<void>(`/v1/messages/${id}/listened`),
  archiveConversation: (id: number) =>
    api.post<void>(`/v1/conversations/${id}/archive`),
  unarchiveConversation: (id: number) =>
    api.delete<void>(`/v1/conversations/${id}/archive`),
  pinConversation: (id: number) =>
    api.post<void>(`/v1/conversations/${id}/pin`),
  unpinConversation: (id: number) =>
    api.delete<void>(`/v1/conversations/${id}/pin`),
  markRead: (id: number) =>
    api.post<void>(`/v1/conversations/${id}/read`),
  markAllRead: () =>
    api.post<void>("/v1/conversations/mark-all-read"),
  deleteConversation: (id: number) =>
    api.delete<void>(`/v1/conversations/${id}`),
  updateConversationColor: (id: number, color: string) =>
    api.put<void>(`/v1/conversations/${id}/color`, { color }),
  muteConversation: (id: number, until?: string) =>
    api.post<{ muted: boolean; muted_until: string | null }>(`/v1/conversations/${id}/mute`, until ? { until } : {}),
  unmuteConversation: (id: number) =>
    api.delete<{ muted: boolean }>(`/v1/conversations/${id}/mute`),
  updateConversationWallpaper: (id: number, wallpaperUrl: string | null) =>
    api.put<{ wallpaper_url: string | null }>(`/v1/conversations/${id}/wallpaper`, { wallpaper_url: wallpaperUrl }),
  updateConversationDestruct: (id: number, destructAfterSeconds: number | null) =>
    api.put<{ destruct_after_seconds: number | null }>(`/v1/conversations/${id}/destruct`, { destruct_after_seconds: destructAfterSeconds }),
  getGifts: () => api.get<Gift[]>("/v1/gifts"),
  getStickerPacks: () => api.get<StickerPack[]>("/v1/stickers/packs"),
  getCalls: (cursor?: string) =>
    api.get<PaginatedResponse<unknown>>("/v1/calls", { cursor }),
  initiateCall: (conversationId: number, type: "audio" | "video") =>
    api.post<{ room_name: string; token: string }>("/v1/calls", { conversation_id: conversationId, type }),
  getCall: (id: number) => api.get<unknown>(`/v1/calls/${id}`),
  updateCallStatus: (id: number, status: string) =>
    api.put<void>(`/v1/calls/${id}/status`, { status }),
  generateAgoraToken: (data: { channel_name: string; call_id?: number }) =>
    api.post<{
      token: string;
      app_id: string;
      channel: string;
      uid: number;
      expire_ts: number;
    }>("/v1/calls/agora-token", data),
  generateAgoraViewerToken: (data: { channel_name: string }) =>
    api.post<{
      token: string;
      app_id: string;
      channel: string;
      uid: number;
      expire_ts: number;
    }>("/v1/calls/viewer-token", data),
  getBroadcasts: (cursor?: string) =>
    api.get<PaginatedResponse<unknown>>("/v1/broadcasts", { cursor }).then(normalizeConversationPage),
  createBroadcast: (data: { name: string; member_ids: number[] }) =>
    api.post<unknown>("/v1/broadcasts", data).then((raw) => normalizeConversation(raw)),
  updateBroadcast: (id: number, data: { name?: string }) =>
    api.put<unknown>(`/v1/broadcasts/${id}`, data).then((raw) => normalizeConversation(raw)),
  deleteBroadcast: (id: number) => api.delete<void>(`/v1/broadcasts/${id}`),
  getBroadcastMembers: (id: number) => api.get<unknown[]>(`/v1/broadcasts/${id}/members`),
  addBroadcastMembers: (id: number, userIds: number[]) =>
    api.post<void>(`/v1/broadcasts/${id}/members`, { user_ids: userIds }),
  removeBroadcastMember: (id: number, userId: number) =>
    api.delete<void>(`/v1/broadcasts/${id}/members/${userId}`),
  sendBroadcast: (id: number, message: string) =>
    api.post<void>(`/v1/broadcasts/${id}/send`, { message }),
  getConversationMedia: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<unknown>>(`/v1/conversations/${id}/media`, { cursor }).then(normalizeMessagePage),
  getConversationPinnedMessages: (id: number) =>
    api.get<unknown>(`/v1/conversations/${id}/pinned-messages`).then((raw) => normalizeMessagePage(raw).data),
  getStarredMessages: (cursor?: string) =>
    api.get<PaginatedResponse<unknown>>("/v1/messages/favorites", { cursor }).then(normalizeMessagePage),
  searchConversationMessages: (id: number, q: string, cursor?: string) =>
    api.get<PaginatedResponse<unknown>>(`/v1/conversations/${id}/search`, { q, cursor }).then(normalizeMessagePage),
};
