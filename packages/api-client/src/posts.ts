import { api } from "./client";
import type { Post, Comment, MediaItem, ReactionType, ColoredTemplate, PaginatedResponse, Job, Offer } from "./types/index";
import type { PublicUser } from "./types/user";

/**
 * Post overflow menu (`PostHeaderActions` / `PostCard`) — canonical HTTP routes (gateway → post-service):
 *
 * | Action | Method · path |
 * |--------|----------------|
 * | Save / unsave | `POST` · `DELETE` `/v1/posts/:id/save` |
 * | Hide | `POST` `/v1/posts/:id/hide` |
 * | Report | `POST` `/v1/posts/:id/report` |
 * | Delete | `DELETE` `/v1/posts/:id` |
 * | Pin / unpin | `POST` · `DELETE` `/v1/posts/:id/pin` |
 * | Boost / cancel boost | `POST` · `DELETE` `/v1/posts/:id/boost` |
 * | Toggle comments | `PUT` `/v1/posts/:id/comments-status` |
 * | Share (reshare to timeline/group/page/wall) | `POST` `/v1/posts/:id/share` |
 * | Reaction add/remove | `POST` · `DELETE` `/v1/posts/:id/react` |
 */

export interface UrlPreview {
  url: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  site_name?: string | null;
  embed_html?: string | null;
}

export interface CreatePostPayload {
  content: string;
  privacy: Post["privacy"];
  post_type?: string;
  /** Optional Open Graph preview produced by `postsApi.previewUrl()`. */
  link_preview?: UrlPreview;
  feeling?: string;
  location?: string;
  poll_options?: string[];
  shared_post_id?: number;
  group_id?: number;
  page_id?: number;
  colored_background?: string;
  colored_text_color?: string;
  scheduled_at?: string;
  media?: { id?: number; url: string; type: string; thumbnail?: string }[];
}

export const postsApi = {
  getFeed: (cursor?: string, filter?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/feed", { cursor, filter }),
  getExploreFeed: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/feed/explore", { cursor }),
  getMostLiked: (cursor?: string, period?: "today" | "week" | "month" | "all") =>
    api.get<PaginatedResponse<Post>>("/v1/posts/most-liked", { cursor, period }),
  getOpenToWorkPosts: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/posts/open-to-work", { cursor }),
  getMemories: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/memories", { cursor }),
  getPost: (id: number) => api.get<Post>(`/v1/posts/${id}`),
  createPost: (data: CreatePostPayload) => api.post<Post>("/v1/posts", data),
  /** Fetch Open Graph + oEmbed preview for a URL (cached server-side for 24h). */
  previewUrl: (url: string) =>
    api.post<UrlPreview>("/v1/posts/preview-url", { url }),
  updatePost: (id: number, data: Partial<CreatePostPayload>) =>
    api.patch<Post>(`/v1/posts/${id}`, data),
  deletePost: (id: number) => api.delete<void>(`/v1/posts/${id}`),
  reactToPost: (id: number, reaction: string) =>
    api.post<void>(`/v1/posts/${id}/react`, { reaction }),
  removeReaction: (id: number) => api.delete<void>(`/v1/posts/${id}/react`),
  savePost: (id: number) => api.post<void>(`/v1/posts/${id}/save`),
  unsavePost: (id: number) => api.delete<void>(`/v1/posts/${id}/save`),
  hidePost: (id: number) => api.post<void>(`/v1/posts/${id}/hide`),
  sharePost: (
    id: number,
    content?: string,
    /**
     * Internal re-share targets (plan §3.13 SH1-SH3). Pick exactly one.
     * - `group_id`      — share to a group the caller belongs to.
     * - `page_id`       — share as a page the caller administers.
     * - `user_wall_id`  — post onto another user's wall (Facebook-style).
     * Leaving all unset shares on the caller's own timeline.
     */
    target?: {
      group_id?: number;
      page_id?: number;
      user_wall_id?: number;
    },
  ) => api.post<Post>(`/v1/posts/${id}/share`, { content, ...target }),
  getSavedPosts: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/posts/saved", { cursor }),
  getReactionTypes: () => api.get<ReactionType[]>("/v1/posts/reaction-types"),
  getColoredTemplates: () => api.get<ColoredTemplate[]>("/v1/posts/colored-templates"),
  votePoll: (postId: number, optionId: number) =>
    api.post<void>(`/v1/posts/${postId}/poll/vote`, { option_id: optionId }),
  getComments: (postId: number, cursor?: string) =>
    api.get<PaginatedResponse<Comment>>(`/v1/posts/${postId}/comments`, { cursor }),
  createComment: (
    postId: number,
    data: { content?: string; reply_to?: number; media?: MediaItem | null },
  ) =>
    api.post<Comment>(`/v1/posts/${postId}/comments`, {
      content: data.content ?? "",
      parent_id: data.reply_to,
      media: data.media ?? undefined,
    }),
  deleteComment: (id: number) => api.delete<void>(`/v1/comments/${id}`),
  updateComment: (id: number, data: { content: string }) =>
    api.put<Comment>(`/v1/comments/${id}`, data),
  reactToComment: (id: number, reaction: string) =>
    api.post<void>(`/v1/comments/${id}/react`, { reaction_type: reaction }),
  removeCommentReaction: (id: number) =>
    api.delete<void>(`/v1/comments/${id}/react`),
  getUserPosts: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<Post>>(`/v1/users/${username}/posts`, { cursor }),
  uploadPostMedia: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<{ media: import("./types/index").MediaItem[] }>("/v1/media/upload", formData, onProgress),
  getBoostedPosts: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/boosted/posts", { cursor }),
  reportPost: (id: number, reason: string, details?: string) =>
    api.post<void>(`/v1/posts/${id}/report`, { reason, details }),
  pinPost: (id: number) => api.post<void>(`/v1/posts/${id}/pin`),
  unpinPost: (id: number) => api.delete<void>(`/v1/posts/${id}/pin`),
  boostPost: (id: number, budget: number, days?: number) =>
    api.post<{ boosted: true }>(`/v1/posts/${id}/boost`, { budget, days }),
  unboostPost: (id: number) =>
    api.delete<{ boosted: false }>(`/v1/posts/${id}/boost`),
  toggleCommentsStatus: (id: number, enabled: boolean) =>
    api.put<{ can_comment: boolean }>(`/v1/posts/${id}/comments-status`, { enabled }),
  getPostReactors: (id: number, reactionType?: string, cursor?: number) =>
    api.get<PaginatedResponse<PublicUser & { reaction: string }>>(
      `/v1/posts/${id}/reactors`,
      { type: reactionType, cursor }
    ),
  createAudioPost: (formData: FormData) =>
    api.post<Post>("/v1/posts/audio", formData),
  createFunding: (data: { title: string; description?: string; goal_amount: number; image?: string }) =>
    api.post<{ id: number }>("/v1/funding", data),
  createJob: (data: {
    title: string;
    description?: string;
    category?: string;
    category_id?: number;
    location?: string;
    lat?: number;
    lng?: number;
    salary_min?: number;
    salary_max?: number;
    salary_period?: string;
    job_type?: string;
    image?: string;
    currency?: string;
    questions?: Array<{ id?: number; question: string; required: boolean; question_type?: string; options?: string[] }>;
  }) => api.post<{ id: number }>("/v1/jobs", data),
  createOffer: (data: {
    title: string;
    description?: string;
    image?: string;
    discount_type?: "percentage" | "flat" | string;
    discount_value: number;
    currency?: string;
    expires_at?: string;
    page_id?: number;
  }) => api.post<{ id: number }>("/v1/offers", data),

  /**
   * Record a post impression (dwell time & scroll depth).
   * Used by the feed for analytics — distinct from `recordView` which
   * tracks a deliberate view intent (e.g. opening the post detail modal).
   */
  recordImpression: (postId: number, data: { dwell_ms: number; scroll_depth: number; source: string }) =>
    api.post<void>(`/v1/posts/${postId}/impression`, data),

  /**
   * Plan §3.18 SA7 — track individual viewers of a post.
   * `recordView` is idempotent: the first call for each (user, post) pair
   * bumps `posts.post_views`; subsequent calls only update the timestamp.
   */
  recordView: (id: number) =>
    api.post<{ viewed: boolean }>(`/v1/posts/${id}/view`),
  getPostViewers: (id: number, cursor?: number) =>
    api.get<{
      viewers: Array<{
        id: number;
        user_id: number;
        username: string;
        first_name: string;
        last_name: string;
        avatar: string;
        viewed_at: string;
      }>;
      total: number;
      cursor: number | null;
    }>(`/v1/posts/${id}/viewers`, { cursor }),

  // ── Reel Bonuses (Creator Monetization) ──
  getReelBonuses: () =>
    api.get<{
      total_earnings: number;
      pending_earnings: number;
      paid_earnings: number;
      total_views: number;
      currency: string;
    }>("/v1/reels/bonuses"),

  getReelBonusHistory: (params?: { limit?: number; cursor?: string }) =>
    api.get<{
      data: Array<{
        id: number;
        amount: number;
        views: number;
        status: string;
        created_at: string;
        paid_at: string | null;
      }>;
      meta: { has_more: boolean; cursor: string | null };
    }>("/v1/reels/bonuses/history", params),
};
