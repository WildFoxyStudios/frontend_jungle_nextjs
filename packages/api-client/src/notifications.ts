import { api } from "./client";
import { normalizeNotificationPage } from "./notification-normalize";
import type { Notification, Announcement, PaginatedResponse } from "./types/index";

export const notificationsApi = {
  getNotifications: (cursor?: string) =>
    api.get<unknown>("/v1/notifications", { cursor }).then(normalizeNotificationPage),
  getUnreadCount: () => api.get<{ count: number }>("/v1/notifications/unread-count"),
  markAsRead: (id: number) => api.post<void>(`/v1/notifications/${id}/read`),
  markAllAsRead: () => api.post<void>("/v1/notifications/read-all"),
  deleteNotification: (id: number) => api.delete<void>(`/v1/notifications/${id}`),
  clearAll: () => api.delete<void>("/v1/notifications/clear"),
  getPreferences: () => api.get<Record<string, boolean>>("/v1/notifications/preferences"),
  updatePreferences: (prefs: Record<string, boolean>) =>
    api.put<Record<string, boolean>>("/v1/notifications/preferences", prefs),
  registerPushToken: (data: { token: string; platform: string }) =>
    api.post<void>("/v1/notifications/push-tokens", data),
  unregisterPushToken: (token: string) =>
    api.delete<void>(`/v1/notifications/push-tokens/${encodeURIComponent(token)}`),
  // VAPID Web Push (W3C Push API)
  getWebPushPublicKey: () =>
    api.get<{ public_key: string }>("/v1/notifications/web-push/public-key"),
  subscribeWebPush: (data: {
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent?: string;
  }) => api.post<void>("/v1/notifications/web-push/subscribe", data),
  unsubscribeWebPush: (endpoint: string) =>
    api.post<void>("/v1/notifications/web-push/unsubscribe", { endpoint }),
  getAnnouncements: () => api.get<Announcement[]>("/v1/announcements"),
  dismissAnnouncement: (id: number) => api.post<void>(`/v1/announcements/${id}/dismiss`),
  subscribeNewsletter: (email: string) =>
    api.post<void>("/v1/newsletter/subscribe", { email }),
  unsubscribeNewsletter: (email: string) =>
    api.post<void>("/v1/newsletter/unsubscribe", { email }),
};
