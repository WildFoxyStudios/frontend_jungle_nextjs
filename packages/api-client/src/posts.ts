import { api } from "./client";
import type { Post, Comment, ReactionType, ColoredTemplate, PaginatedResponse } from "./types/index";
import type { PublicUser } from "./types/user";

export interface CreatePostPayload {
  content: string;
  privacy: Post["privacy"];
  post_type?: string;
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
  updatePost: (id: number, data: Partial<CreatePostPayload>) =>
    api.patch<Post>(`/v1/posts/${id}`, data),
  deletePost: (id: number) => api.delete<void>(`/v1/posts/${id}`),
  reactToPost: (id: number, reaction: string) =>
    api.post<void>(`/v1/posts/${id}/react`, { reaction }),
  removeReaction: (id: number) => api.delete<void>(`/v1/posts/${id}/react`),
  savePost: (id: number) => api.post<void>(`/v1/posts/${id}/save`),
  unsavePost: (id: number) => api.delete<void>(`/v1/posts/${id}/save`),
  hidePost: (id: number) => api.post<void>(`/v1/posts/${id}/hide`),
  sharePost: (id: number, content?: string) =>
    api.post<Post>(`/v1/posts/${id}/share`, { content }),
  getSavedPosts: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/posts/saved", { cursor }),
  getReactionTypes: () => api.get<ReactionType[]>("/v1/posts/reaction-types"),
  getColoredTemplates: () => api.get<ColoredTemplate[]>("/v1/posts/colored-templates"),
  votePoll: (postId: number, optionId: number) =>
    api.post<void>(`/v1/posts/${postId}/poll/vote`, { option_id: optionId }),
  getComments: (postId: number, cursor?: string) =>
    api.get<PaginatedResponse<Comment>>(`/v1/posts/${postId}/comments`, { cursor }),
  createComment: (postId: number, data: { content: string; reply_to?: number; media_id?: number }) =>
    api.post<Comment>(`/v1/posts/${postId}/comments`, data),
  deleteComment: (id: number) => api.delete<void>(`/v1/comments/${id}`),
  updateComment: (id: number, data: { content: string }) =>
    api.patch<Comment>(`/v1/comments/${id}`, data),
  reactToComment: (id: number, reaction: string) =>
    api.post<void>(`/v1/comments/${id}/react`, { reaction }),
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
};
