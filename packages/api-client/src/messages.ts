import { api } from "./client";
import type { Conversation, Message, Gift, StickerPack, PaginatedResponse } from "./types/index";

export const messagesApi = {
  getConversations: (cursor?: string) =>
    api.get<PaginatedResponse<Conversation>>("/v1/conversations", { cursor }),
  getPinnedConversations: () =>
    api.get<PaginatedResponse<Conversation>>("/v1/conversations/pinned"),
  getArchivedConversations: () =>
    api.get<PaginatedResponse<Conversation>>("/v1/conversations/archived"),
  getConversation: (id: number) =>
    api.get<Conversation>(`/v1/conversations/${id}`),
  createConversation: (userId: number) =>
    api.post<Conversation>("/v1/conversations", { user_id: userId }),
  createGroupConversation: (data: { name: string; member_ids: number[]; avatar?: string }) =>
    api.post<Conversation>("/v1/conversations/group", data),
  updateGroupConversation: (id: number, data: { name?: string; avatar?: string }) =>
    api.put<Conversation>(`/v1/conversations/group/${id}`, data),
  getMessages: (conversationId: number, cursor?: string) =>
    api.get<PaginatedResponse<Message>>(`/v1/conversations/${conversationId}/messages`, { cursor }),
  sendMessage: (conversationId: number, data: { content?: string; type?: string; media_id?: number; sticker_id?: number; gift_id?: number; reply_to?: number }) =>
    api.post<Message>(`/v1/conversations/${conversationId}/messages`, data),
  sendTypingIndicator: (conversationId: number) =>
    api.post<void>(`/v1/conversations/${conversationId}/typing`),
  deleteMessage: (id: number) => api.delete<void>(`/v1/messages/${id}`),
  forwardMessage: (messageId: number, conversationIds: number[]) =>
    api.post<void>(`/v1/messages/${messageId}/forward`, { conversation_ids: conversationIds }),
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
    api.get<PaginatedResponse<Conversation>>("/v1/broadcasts", { cursor }),
  createBroadcast: (data: { name: string; member_ids: number[] }) =>
    api.post<Conversation>("/v1/broadcasts", data),
  updateBroadcast: (id: number, data: { name?: string }) =>
    api.put<Conversation>(`/v1/broadcasts/${id}`, data),
  deleteBroadcast: (id: number) => api.delete<void>(`/v1/broadcasts/${id}`),
  getBroadcastMembers: (id: number) => api.get<unknown[]>(`/v1/broadcasts/${id}/members`),
  addBroadcastMembers: (id: number, userIds: number[]) =>
    api.post<void>(`/v1/broadcasts/${id}/members`, { user_ids: userIds }),
  removeBroadcastMember: (id: number, userId: number) =>
    api.delete<void>(`/v1/broadcasts/${id}/members/${userId}`),
  sendBroadcast: (id: number, message: string) =>
    api.post<void>(`/v1/broadcasts/${id}/send`, { message }),
  getConversationMedia: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<Message>>(`/v1/conversations/${id}/media`, { cursor }),
  getConversationPinnedMessages: (id: number) =>
    api.get<Message[]>(`/v1/conversations/${id}/pinned-messages`),
  getStarredMessages: (cursor?: string) =>
    api.get<PaginatedResponse<Message>>("/v1/messages/favorites", { cursor }),
  searchConversationMessages: (id: number, q: string, cursor?: string) =>
    api.get<PaginatedResponse<Message>>(`/v1/conversations/${id}/search`, { q, cursor }),
};
