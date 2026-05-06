import { api } from "./client";
import type { PaginatedResponse, Post } from "./types/index";

/**
 * Result row emitted by the backend's `search_type_internal` helper. The
 * shape is uniform for every entity type and matches the `SearchResult`
 * struct in `crates/shared/src/search.rs`.
 */
export interface SearchResult {
  id: number;
  name: string | null;
  image: string | null;
  /** Discriminator — one of: `user`, `page`, `group`, `hashtag`, `post`, `blog`, `product`, `event`, `reel`. */
  result_type:
    | "user"
    | "page"
    | "group"
    | "hashtag"
    | "post"
    | "blog"
    | "product"
    | "event"
    | "reel";
  rank: number;
}

/** Aggregated "search all" payload — grouped by entity type. */
export interface SearchAllResults {
  users: SearchResult[];
  pages: SearchResult[];
  groups: SearchResult[];
  hashtags: SearchResult[];
  /** Full-text post previews (`name` = content snippet). */
  posts?: SearchResult[];
  /** Blog FTS hits (`name` = title, `image` = thumbnail when present). */
  blogs?: SearchResult[];
  /** Active marketplace products (ilike on name/description). */
  products?: SearchResult[];
  /** Site events (ilike on name, description, location). */
  events?: SearchResult[];
  /** Short-form video reels (`posts.is_reel`, FTS — same snippet shape as posts). */
  reels?: SearchResult[];
}

/**
 * Normalizes GET `/v1/search?type=…` JSON. The gateway may return `{ data: SearchResult[] }`
 * or `{ data, type }` — both expose the list on `data`.
 */
export function unwrapTypedSearchData(body: unknown): SearchResult[] {
  if (!body || typeof body !== "object") return [];
  const d = (body as { data?: unknown }).data;
  return Array.isArray(d) ? (d as SearchResult[]) : [];
}

/** Max rows for a single `type=` search (backend clamps 1–50). */
export const SEARCH_TYPED_MAX_LIMIT = 50;

/** Optional `GET /v1/search` narrowing for the **users** bucket / `type=user`. */
export interface SearchUsersFilterQuery {
  gender?: string;
  verified_only?: boolean;
  has_photo?: boolean;
  age_min?: number;
  age_max?: number;
}

export const searchApi = {
  /**
   * Single-type search — returns `{ data, type }` (see `unwrapTypedSearchData`).
   * Backend: `/v1/search?q=&type=<…>&limit=` (default 20, max 50).
   */
  search: (
    query: string,
    type?: string,
    cursor?: string,
    limit?: number,
    userFilters?: SearchUsersFilterQuery,
  ) =>
    api.get<unknown>("/v1/search", {
      q: query,
      type,
      cursor,
      ...(limit != null ? { limit } : {}),
      ...(userFilters ?? {}),
    }),
  /**
   * Global aggregated search — grouped buckets (users, pages, groups, hashtags, posts, blogs, products, events).
   */
  searchAll: (query: string, userFilters?: SearchUsersFilterQuery) =>
    api.get<SearchAllResults>("/v1/search", { q: query, ...(userFilters ?? {}) }),
  getRecentSearches: () =>
    api.get<{ id: number; search_type: string; target_id: number; searched_at: string }[]>(
      "/v1/search/recent",
    ),
  saveRecentSearch: (search_type: string, target_id: number) =>
    api.post<{ saved: boolean }>("/v1/search/recent", { search_type, target_id }),
  clearRecentSearch: (id: number) => api.delete<void>(`/v1/search/recent/${id}`),
  clearAllRecentSearches: () => api.delete<void>("/v1/search/recent"),
  getTrendingHashtags: () =>
    api.get<{ tag: string; count: number }[]>("/v1/hashtags/trending"),
  getHashtagPosts: (tag: string, cursor?: string) =>
    api.get<PaginatedResponse<Post>>(`/v1/hashtags/${tag}/posts`, { cursor }),
};
