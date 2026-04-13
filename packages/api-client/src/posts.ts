import { api } from "./client";
import type { Post, Comment, ReactionType, ColoredTemplate, PaginatedResponse } from "./types/index";

export interface CreatePostPayload {
  content: string;
  privacy: "public" | "friends" | "only_me";
  post_type?: string;
  feeling?: string;
  location?: string;
  poll_options?: string[];
  shared_post_id?: number;
  group_id?: number;
  page_id?: number;
  colored_background?: string;
  colored_text_color?: string;
}

export const postsApi = {
  getFeed: (cursor?: string, filter?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/feed", { cursor, filter }),
  getExploreFeed: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/feed/explore", { cursor }),
  getMostLiked: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/posts/most-liked", { cursor }),
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
  createComment: (postId: number, data: { content: string; reply_to?: number }) =>
    api.post<Comment>(`/v1/posts/${postId}/comments`, data),
  deleteComment: (id: number) => api.delete<void>(`/v1/comments/${id}`),
  reactToComment: (id: number, reaction: string) =>
    api.post<void>(`/v1/comments/${id}/react`, { reaction }),
  getUserPosts: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<Post>>(`/v1/users/${username}/posts`, { cursor }),
  uploadPostMedia: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<{ media: import("./types/index").MediaItem[] }>("/v1/media/upload", formData, onProgress),
  getBoostedPosts: (cursor?: string) =>
    api.get<PaginatedResponse<Post>>("/v1/boosted/posts", { cursor }),
  reportPost: (id: number, reason: string) =>
    api.post<void>(`/v1/posts/${id}/report`, { reason }),
  pinPost: (id: number) => api.post<void>(`/v1/posts/${id}/pin`),
  unpinPost: (id: number) => api.delete<void>(`/v1/posts/${id}/pin`),
  boostPost: (id: number, budget: number) =>
    api.post<void>(`/v1/posts/${id}/boost`, { budget }),
};
