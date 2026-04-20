import { api } from "./client";
import type { PaginatedResponse, Post } from "./types/index";

export interface SearchResults {
  users?: unknown[];
  posts?: Post[];
  pages?: unknown[];
  groups?: unknown[];
  hashtags?: { tag: string; count: number }[];
  blogs?: unknown[];
  products?: unknown[];
  events?: unknown[];
}

export const searchApi = {
  search: (query: string, type?: string, cursor?: string) =>
    api.get<PaginatedResponse<unknown>>("/v1/search", { q: query, type, cursor }),
  searchAll: (query: string) =>
    api.get<SearchResults>("/v1/search", { q: query }),
  getRecentSearches: () =>
    api.get<{ id: number; query: string; created_at: string }[]>("/v1/search/recent"),
  clearRecentSearch: (id: number) => api.delete<void>(`/v1/search/recent/${id}`),
  clearAllRecentSearches: () => api.delete<void>("/v1/search/recent"),
  getTrendingHashtags: () =>
    api.get<{ tag: string; count: number }[]>("/v1/hashtags/trending"),
  getHashtagPosts: (tag: string, cursor?: string) =>
    api.get<PaginatedResponse<Post>>(`/v1/hashtags/${tag}/posts`, { cursor }),
};
