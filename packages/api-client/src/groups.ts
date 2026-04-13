import { api } from "./client";
import type { Group, Page, PaginatedResponse, PublicUser } from "./types/index";

export const groupsApi = {
  getGroups: (cursor?: string) =>
    api.get<PaginatedResponse<Group>>("/v1/groups", { cursor }),
  getCategories: () => api.get<{ id: number; name: string }[]>("/v1/groups/categories"),
  searchGroups: (q: string, cursor?: string) =>
    api.get<PaginatedResponse<Group>>("/v1/groups/search", { q, cursor }),
  getSuggested: (cursor?: string) =>
    api.get<PaginatedResponse<Group>>("/v1/groups/suggested", { cursor }),
  getMyGroups: (cursor?: string) =>
    api.get<PaginatedResponse<Group>>("/v1/groups/my", { cursor }),
  getJoinedGroups: (cursor?: string) =>
    api.get<PaginatedResponse<Group>>("/v1/groups/joined", { cursor }),
  getGroup: (slug: string) => api.get<Group>(`/v1/groups/${slug}`),
  createGroup: (data: Partial<Group> & { name: string }) =>
    api.post<Group>("/v1/groups", data),
  updateGroup: (id: number, data: Partial<Group>) =>
    api.patch<Group>(`/v1/groups/${id}`, data),
  deleteGroup: (id: number) => api.delete<void>(`/v1/groups/${id}`),
  joinGroup: (id: number) => api.post<void>(`/v1/groups/${id}/join`),
  leaveGroup: (id: number) => api.delete<void>(`/v1/groups/${id}/join`),
  approveJoinRequest: (groupId: number, userId: number) =>
    api.post<void>(`/v1/groups/${groupId}/join-requests/${userId}/approve`),
  rejectJoinRequest: (groupId: number, userId: number) =>
    api.post<void>(`/v1/groups/${groupId}/join-requests/${userId}/reject`),
  getMembers: (groupId: number, cursor?: string) =>
    api.get<PaginatedResponse<PublicUser & { role: string }>>(`/v1/groups/${groupId}/members`, { cursor }),
  kickMember: (groupId: number, userId: number) =>
    api.delete<void>(`/v1/groups/${groupId}/members/${userId}`),
  updateMemberRole: (groupId: number, userId: number, role: string) =>
    api.post<void>(`/v1/groups/${groupId}/members/${userId}/role`, { role }),
  getGroupPosts: (groupId: number, cursor?: string) =>
    api.get<PaginatedResponse<import("./types/index").Post>>(`/v1/groups/${groupId}/posts`, { cursor }),
  checkName: (name: string) => api.get<{ available: boolean }>("/v1/groups/check-name", { name }),
  inviteMember: (groupId: number, userId: number) =>
    api.post<void>(`/v1/groups/${groupId}/invite`, { user_id: userId }),
  getJoinRequests: (groupId: number) =>
    api.get<PublicUser[]>(`/v1/groups/${groupId}/join-requests`),
  uploadGroupAvatar: (id: number, formData: FormData) =>
    api.upload<{ avatar: string }>(`/v1/groups/${id}/avatar`, formData),
  uploadGroupCover: (id: number, formData: FormData) =>
    api.upload<{ cover: string }>(`/v1/groups/${id}/cover`, formData),
  getBoostedPages: (cursor?: string) =>
    api.get<PaginatedResponse<Page>>("/v1/boosted/pages", { cursor }),
};
