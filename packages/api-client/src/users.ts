import { api } from "./client";
import {
  addressToApiBody,
  normalizeAddressFromApi,
  normalizeAddressResponse,
} from "./address-normalize";
import type {
  Address,
  User,
  PublicUser,
  PaginatedResponse,
  CustomProfileField,
  UserExperience,
  UserCertification,
  UserSkill,
  UserProject,
} from "./types/index";

export interface ProfessionalSearchResult {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string;
  is_verified: boolean;
  is_pro: number;
  working: string;
  school: string;
  about: string;
  address: string;
  city: string;
  website: string;
}

/**
 * Slim user shape returned by `/v1/users/birthdays` — only the fields the
 * server emits today (no last_name/cover/etc). Use this anywhere the UI
 * just needs a chip/avatar.
 */
export interface BirthdayUser {
  id: number;
  username: string;
  first_name: string | null;
  avatar: string | null;
  is_verified: boolean;
}

/** Result row for `/v1/skills/search` autocomplete. */
export interface SkillSuggestion {
  id: number;
  name: string;
  endorsement_count: number;
}

export interface UpdateCustomFieldValueInput {
  field_id: number;
  value: string;
}

/**
 * Row returned by `GET /v1/social/follow-requests`.
 *
 * `id` is the primary key of the `follows` table (needed for accept/reject),
 * while `follower_id` is the user id of the person who wants to follow us.
 * Matches `FollowRequestRow` in `crates/user-service/src/handlers/extras.rs`.
 */
export interface FollowRequest {
  id: number;
  follower_id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string;
  created_at: string;
  /** Optional — populated when the backend enriches follow requests with
   * mutual-friend counts (see extras.rs:list_follow_requests). Consumers
   * should default to 0 when absent. */
  mutual_friends?: number;
}

/**
 * `GET /v1/users/:username` returns `{ data: { id, user: PublicUser, follower_count, ... } }`.
 * After unwrapping `data`, the client must merge `user` with sibling fields into a `User`.
 */
interface GetUserByUsernameEnvelope {
  id?: number;
  user: {
    uuid: string;
    username: string;
    first_name: string;
    last_name: string;
    name: string;
    avatar: string;
    cover: string;
    about: string;
    is_verified: boolean;
    is_pro: number;
    is_online: boolean;
  };
  follower_count?: number;
  following_count?: number;
  post_count?: number;
  created_at?: string;
  updated_at?: string;
  is_following?: boolean;
  is_following_me?: boolean;
  gender?: string;
  birthday?: string | null;
  website?: string;
  location?: string;
  school?: string;
  working?: string;
  working_link?: string;
  social_links?: User["social_links"];
  is_admin?: boolean;
  is_banned?: boolean;
  two_factor_enabled?: boolean;
  email_verified?: boolean;
  email?: string;
  is_muted?: boolean;
  is_blocked?: boolean;
}

function normalizeGetUserByUsernamePayload(data: GetUserByUsernameEnvelope | User): User {
  if (!data || typeof data !== "object") return data as User;
  const d = data as GetUserByUsernameEnvelope;
  if (!("user" in d) || !d.user || typeof d.user !== "object") {
    return data as User;
  }
  const u = d.user;
  const id = Number(d.id);
  const base = {
    id: Number.isFinite(id) && id > 0 ? id : 0,
    uuid: String(u.uuid ?? ""),
    username: String(u.username ?? ""),
    email: String(d.email ?? ""),
    first_name: String(u.first_name ?? ""),
    last_name: String(u.last_name ?? ""),
    name:
      String(u.name ?? "")
        .trim()
        || `${String(u.first_name ?? "").trim()} ${String(u.last_name ?? "").trim()}`.trim()
        || String(u.username ?? ""),
    avatar: String(u.avatar ?? ""),
    cover: String(u.cover ?? ""),
    about: String(u.about ?? ""),
    is_verified: Boolean(u.is_verified),
    is_pro: Number(u.is_pro ?? 0),
    is_online: Boolean(u.is_online),
    is_admin: Boolean(d.is_admin),
    is_banned: Boolean(d.is_banned),
    follower_count: Number(d.follower_count ?? 0),
    following_count: Number(d.following_count ?? 0),
    post_count: Number(d.post_count ?? 0),
    last_seen: "",
    created_at: d.created_at ?? new Date(0).toISOString(),
    updated_at: d.updated_at ?? d.created_at ?? new Date(0).toISOString(),
  };
  const out: User = {
    ...base,
    email_verified: Boolean(d.email_verified),
  };
  if (d.gender !== undefined && d.gender !== null) out.gender = String(d.gender);
  if (d.birthday !== undefined && d.birthday !== null) out.birthday = String(d.birthday);
  if (d.website !== undefined && d.website !== null && d.website !== "") out.website = String(d.website);
  if (d.location !== undefined && d.location !== null && d.location !== "") out.location = String(d.location);
  if (d.school !== undefined && d.school !== null && d.school !== "") out.school = String(d.school);
  if (d.working !== undefined && d.working !== null && d.working !== "") out.working = String(d.working);
  if (d.working_link !== undefined && d.working_link !== null && d.working_link !== "")
    out.working_link = String(d.working_link);
  if (d.social_links !== undefined && d.social_links !== null) out.social_links = d.social_links;
  if (d.two_factor_enabled !== undefined) out.two_factor_enabled = d.two_factor_enabled;
  if (d.is_following !== undefined) out.is_following = d.is_following;
  if (d.is_following_me !== undefined) out.is_following_me = d.is_following_me;
  if (d.is_muted !== undefined) out.is_muted = d.is_muted;
  if (d.is_blocked !== undefined) out.is_blocked = d.is_blocked;
  return out;
}

export const usersApi = {
  getMe: () => api.get<User>("/v1/users/me"),
  /**
   * Full-text search against the users table. Returns up to `limit` rows
   * (default 20) shaped like a `PublicUser` — handy for admin/member pickers.
   */
  searchUsers: (q: string, limit?: number) =>
    api.get<PublicUser[]>("/v1/users/search", { q, limit }),
  searchProfessionals: (q: string, location?: string, limit?: number) =>
    api.get<ProfessionalSearchResult[]>("/v1/users/search/professional", {
      q,
      location,
      limit,
    }),
  updateMe: (data: Partial<User>) => api.put<User>("/v1/users/me", data),
  getUser: (username: string) =>
    api.get<GetUserByUsernameEnvelope | User>(`/v1/users/${username}`).then(normalizeGetUserByUsernamePayload),
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
    api.upload<{ data: { avatar: string } }>("/v1/media/upload/avatar", formData, onProgress).then((r) => r.data),
  updateCover: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<{ data: { cover: string } }>("/v1/media/upload/cover", formData, onProgress).then((r) => r.data),
  getCommonThings: (username: string) =>
    api.get<{ friends: PublicUser[]; groups: unknown[]; pages: unknown[] }>(`/v1/users/${username}/common`),
  requestFamilyRelationship: (userId: number, relation: string) =>
    api.post<void>(`/v1/social/family/${userId}`, { relation }),
  getCustomFields: () => api.get<CustomProfileField[]>("/v1/users/me/fields"),
  updateCustomFields: (fields: UpdateCustomFieldValueInput[]) =>
    api.put<{ updated: number }>("/v1/users/me/fields", { fields }),
  getExperience: () => api.get<UserExperience[]>("/v1/users/me/experience"),
  addExperience: (data: Omit<UserExperience, "id">) =>
    api.post<UserExperience>("/v1/users/me/experience", data),
  updateExperience: (id: number, data: Partial<UserExperience>) =>
    api.put<UserExperience>(`/v1/users/me/experience/${id}`, data),
  deleteExperience: (id: number) => api.delete<void>(`/v1/users/me/experience/${id}`),
  getCertifications: () => api.get<UserCertification[]>("/v1/users/me/certifications"),
  addCertification: (data: Omit<UserCertification, "id">) =>
    api.post<UserCertification>("/v1/users/me/certifications", data),
  deleteCertification: (id: number) => api.delete<void>(`/v1/users/me/certifications/${id}`),
  getSkills: () => api.get<UserSkill[]>("/v1/users/me/skills"),
  addSkill: (name: string) => api.post<UserSkill>("/v1/users/me/skills", { skill: name }),
  deleteSkill: (id: number) => api.delete<void>(`/v1/users/me/skills/${id}`),

  /** Plan §3.4 PR5 — public skills for someone else's profile. */
  getUserSkills: (username: string) =>
    api.get<UserSkill[]>(`/v1/users/${username}/skills`),

  /** Public experience timeline for any user (id-based per backend). */
  getUserExperience: (userId: number) =>
    api.get<UserExperience[]>(`/v1/users/${userId}/experience`),

  /** Public certifications for any user (id-based per backend). */
  getUserCertifications: (userId: number) =>
    api.get<UserCertification[]>(`/v1/users/${userId}/certifications`),

  /** Public projects for any user (id-based per backend). */
  getUserProjects: (userId: number) =>
    api.get<UserProject[]>(`/v1/users/${userId}/projects`),

  /**
   * Followers whose birthday is today. Backend route:
   * `GET /v1/users/birthdays` (`@user-service/handlers/professional.rs`).
   */
  getBirthdays: () =>
    api.get<{ data: BirthdayUser[] }>("/v1/users/birthdays"),

  /** Pro / premium users (paginated). */
  getProUsers: (cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>("/v1/users/pro-users", { cursor }),

  /** Users who invited me via the referral system (PHP get_invites.php). */
  getMyInviters: () =>
    api.get<{ data: PublicUser[] }>("/v1/users/me/inviters"),

  /** Reset avatar to the platform default. */
  resetAvatar: () =>
    api.post<{ data: { avatar: string | null } }>(
      "/v1/users/me/avatar/reset",
    ),

  /** Skills autocomplete (`/v1/skills/search?q=`). */
  searchSkills: (q: string) =>
    api.get<{ data: SkillSuggestion[] }>("/v1/skills/search", { q }),

  /**
   * Plan §3.4 PR6 — friends the viewer and the target have in common.
   * Response is shaped like the common-things endpoint so the caller can
   * render a count badge and a short preview without a second request.
   */
  getMutualFriends: (userId: number) => {
    if (!Number.isFinite(userId)) {
      return Promise.resolve({ users: [], total: 0 });
    }
    return api.get<{ users: PublicUser[]; total: number }>(
      `/v1/users/${userId}/mutual-friends`,
    );
  },

  /** Plan §3.4 PR2 — recent activities timeline for the viewer. */
  getMyActivities: (cursor?: string) =>
    api.get<PaginatedResponse<{
      id: number;
      activity_type: string;
      target_type: string | null;
      target_id: number | null;
      created_at: string;
      target?: { id: number; name?: string; title?: string; preview?: string };
    }>>("/v1/activities", cursor ? { cursor } : {}),
  getBlockedUsers: (cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>("/v1/social/blocked", { cursor }),
  getPokes: (cursor?: string) =>
    api.get<PaginatedResponse<{ user: PublicUser; created_at: string }>>("/v1/social/pokes", { cursor }),
  getAddresses: async () => {
    const raw = await api.get<unknown>("/v1/users/me/addresses");
    // handleResponse already unwraps single-key envelopes — prefer the
    // array directly, falling back to a { data } envelope if the backend
    // still wraps it.
    const list = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.data;
    return Array.isArray(list) ? list.map((row) => normalizeAddressFromApi(row)) : [];
  },
  createAddress: async (data: Omit<Address, "id">) => {
    const raw = await api.post<unknown>("/v1/users/me/addresses", addressToApiBody(data));
    return normalizeAddressResponse(raw);
  },
  updateAddress: async (id: number, data: Omit<Address, "id">) => {
    const raw = await api.put<unknown>(`/v1/users/me/addresses/${id}`, addressToApiBody(data));
    return normalizeAddressResponse(raw);
  },
  deleteAddress: (id: number) => api.delete<void>(`/v1/users/me/addresses/${id}`),
  getPrivacySettings: () => api.get<Record<string, unknown>>("/v1/users/me/privacy"),
  updatePrivacySettings: (data: Record<string, unknown>) => api.put<void>("/v1/users/me/privacy", data),
  getInviteCode: () => api.get<{ code: string; url: string }>("/v1/users/me/invite-code"),
  getReferrals: () => api.get<{ total: number; users: PublicUser[]; earned: number }>("/v1/users/me/referrals"),
  getSuggestions: (cursor?: string) =>
    api.get<PublicUser[]>("/v1/users/suggestions", { cursor }),
  getPopover: (username: string) =>
    api.get<{
      id: number;
      username: string;
      first_name: string | null;
      last_name: string | null;
      avatar: string | null;
      about: string | null;
      is_verified: boolean;
      follower_count: number;
      following_count: number;
      post_count: number;
      is_following: boolean;
    }>(`/v1/users/${username}/popover`),
  onboardingSkip: (step: "avatar" | "info" | "follow") =>
    api.post<{ skipped: string }>("/v1/users/me/onboarding/skip", { step }),
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
    api.put<UserProject>(`/v1/users/me/projects/${id}`, data),
  deleteProject: (id: number) => api.delete<void>(`/v1/users/me/projects/${id}`),
  updateLocation: (lat: number, lng: number) =>
    api.put<void>("/v1/users/me/location", { lat, lng }),
  downloadMyInfo: (data: string[]) =>
    api.post<{ data: Record<string, unknown>; status?: string }>("/v1/users/me/download-info", { data }),
  getNearbyUsers: (lat: number, lng: number, radius?: number) =>
    api.get<PublicUser[]>("/v1/users/nearby", { lat, lng, radius }),
  getNotificationSettings: () => api.get<Record<string, unknown>>("/v1/users/me/notification-settings"),
  updateNotificationSettings: (data: Record<string, unknown>) =>
    api.put<void>("/v1/users/me/notification-settings", data),
  getFollowRequests: (cursor?: string) =>
    api.get<PaginatedResponse<FollowRequest>>("/v1/social/follow-requests", { cursor }),
  /**
   * Accept/reject a follow request. `id` is the row id returned by
   * `getFollowRequests`, NOT the follower's user id.
   */
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
  createReport: (data: {
    target_type: string;
    target_id: number;
    reason: string;
    description?: string;
  }) => api.post<void>("/v1/reports", data),
};
