import { api } from "./client";
import type { User, PublicUser, PaginatedResponse, CustomProfileField, UserExperience, UserCertification, UserSkill, UserProject } from "./types/index";

export const usersApi = {
  getMe: () => api.get<User>("/v1/users/me"),
  updateMe: (data: Partial<User>) => api.put<User>("/v1/users/me", data),
  getUser: (username: string) => api.get<User>(`/v1/users/${username}`),
  follow: (userId: number) => api.post<void>(`/v1/social/follow/${userId}`),
  unfollow: (userId: number) => api.delete<void>(`/v1/social/follow/${userId}`),
  block: (userId: number) => api.post<void>(`/v1/social/block/${userId}`),
  unblock: (userId: number) => api.delete<void>(`/v1/social/block/${userId}`),
  mute: (userId: number) => api.post<void>(`/v1/social/mute/${userId}`),
  unmute: (userId: number) => api.delete<void>(`/v1/social/mute/${userId}`),
  poke: (userId: number) => api.post<void>(`/v1/social/poke/${userId}`),
  getFollowers: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>(`/v1/users/${username}/followers`, { cursor }),
  getFollowing: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>(`/v1/users/${username}/following`, { cursor }),
  updateAvatar: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<{ avatar: string }>("/v1/users/me/avatar", formData, onProgress),
  updateCover: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<{ cover: string }>("/v1/users/me/cover", formData, onProgress),
  getCommonThings: (username: string) =>
    api.get<{ friends: PublicUser[]; groups: unknown[]; pages: unknown[] }>(`/v1/users/${username}/common`),
  requestFamilyRelationship: (userId: number, relation: string) =>
    api.post<void>(`/v1/social/family/${userId}`, { relation }),
  getCustomFields: () => api.get<CustomProfileField[]>("/v1/users/me/fields"),
  updateCustomFields: (fields: Record<string, string>) =>
    api.put<CustomProfileField[]>("/v1/users/me/fields", fields),
  getExperience: () => api.get<UserExperience[]>("/v1/users/me/experience"),
  addExperience: (data: Omit<UserExperience, "id">) =>
    api.post<UserExperience>("/v1/users/me/experience", data),
  updateExperience: (id: number, data: Partial<UserExperience>) =>
    api.patch<UserExperience>(`/v1/users/me/experience/${id}`, data),
  deleteExperience: (id: number) => api.delete<void>(`/v1/users/me/experience/${id}`),
  getCertifications: () => api.get<UserCertification[]>("/v1/users/me/certifications"),
  addCertification: (data: Omit<UserCertification, "id">) =>
    api.post<UserCertification>("/v1/users/me/certifications", data),
  deleteCertification: (id: number) => api.delete<void>(`/v1/users/me/certifications/${id}`),
  getSkills: () => api.get<UserSkill[]>("/v1/users/me/skills"),
  addSkill: (name: string) => api.post<UserSkill>("/v1/users/me/skills", { name }),
  deleteSkill: (id: number) => api.delete<void>(`/v1/users/me/skills/${id}`),
  getBlockedUsers: (cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>("/v1/social/blocked", { cursor }),
  getPokes: (cursor?: string) =>
    api.get<PaginatedResponse<{ user: PublicUser; created_at: string }>>("/v1/social/pokes", { cursor }),
  getAddresses: () => api.get<import("./types/index").Address[]>("/v1/users/me/addresses"),
  createAddress: (data: Omit<import("./types/index").Address, "id" | "is_default">) =>
    api.post<import("./types/index").Address>("/v1/users/me/addresses", data),
  updateAddress: (id: number, data: Partial<Omit<import("./types/index").Address, "id">>) =>
    api.patch<import("./types/index").Address>(`/v1/users/me/addresses/${id}`, data),
  deleteAddress: (id: number) => api.delete<void>(`/v1/users/me/addresses/${id}`),
  getPrivacySettings: () => api.get<Record<string, unknown>>("/v1/users/me/privacy"),
  updatePrivacySettings: (data: Record<string, unknown>) => api.put<void>("/v1/users/me/privacy", data),
  getInviteCode: () => api.get<{ code: string; url: string }>("/v1/users/me/invite-code"),
  getReferrals: () => api.get<{ total: number; users: PublicUser[]; earned: number }>("/v1/users/me/referrals"),
  getSuggestions: (cursor?: string) =>
    api.get<PublicUser[]>("/v1/users/suggestions", { cursor }),
  downloadMyInfo: () => api.post<{ download_url: string }>("/v1/users/me/download-info"),
  requestVerification: (formData: FormData) => api.upload<void>("/v1/users/me/verification-request", formData),
  deleteMe: () => api.delete<void>("/v1/users/me"),
  updateSocialLinks: (links: {
    facebook?: string; twitter?: string; linkedin?: string;
    instagram?: string; youtube?: string; github?: string;
    vk?: string; tiktok?: string; website?: string;
  }) => api.put<typeof links>("/v1/users/me/social-links", links),
  getProjects: () => api.get<UserProject[]>("/v1/users/me/projects"),
  addProject: (data: Omit<UserProject, "id" | "created_at">) =>
    api.post<UserProject>("/v1/users/me/projects", data),
  updateProject: (id: number, data: Partial<Omit<UserProject, "id" | "created_at">>) =>
    api.patch<UserProject>(`/v1/users/me/projects/${id}`, data),
  deleteProject: (id: number) => api.delete<void>(`/v1/users/me/projects/${id}`),
  updateLocation: (lat: number, lng: number) =>
    api.put<void>("/v1/users/me/location", { lat, lng }),
  getNearbyUsers: (lat: number, lng: number, radius?: number) =>
    api.get<PublicUser[]>("/v1/users/nearby", { lat, lng, radius }),
  getNotificationSettings: () => api.get<Record<string, unknown>>("/v1/users/me/notification-settings"),
  updateNotificationSettings: (data: Record<string, unknown>) =>
    api.put<void>("/v1/users/me/notification-settings", data),
  getFollowRequests: (cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>("/v1/social/follow-requests", { cursor }),
  acceptFollowRequest: (id: number) =>
    api.post<void>(`/v1/social/follow-requests/${id}/accept`),
  rejectFollowRequest: (id: number) =>
    api.post<void>(`/v1/social/follow-requests/${id}/reject`),
  stopNotify: (userId: number) =>
    api.post<void>(`/v1/social/stop-notify/${userId}`),
  setOpenToWork: (data: { title: string; skills: string[] }) =>
    api.post<void>("/v1/users/me/open-to-work", data),
  unsetOpenToWork: () => api.delete<void>("/v1/users/me/open-to-work"),
  setProvidingService: (data: { title: string; description: string }) =>
    api.post<void>("/v1/users/me/providing-service", data),
  unsetProvidingService: () => api.delete<void>("/v1/users/me/providing-service"),
  createReport: (data: { type: string; target_id: number; reason: string }) =>
    api.post<void>("/v1/reports", data),
};
