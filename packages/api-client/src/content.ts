import { api } from "./client";
import type { ForumSection, Forum, ForumThread, ForumReply, Movie, Game, PaginatedResponse, UserAd } from "./types/index";

export interface OAuthApp {
  id: number;
  name: string;
  description: string;
  website: string;
  callback_url: string;
  client_id: string;
  client_secret: string;
  created_at: string;
}

export const contentApi = {
  // Forums
  getForumSections: () => api.get<ForumSection[]>("/v1/forums/sections"),
  getForum: (id: number) => api.get<Forum>(`/v1/forums/${id}`),
  getForumThreads: (forumId: number, cursor?: string) =>
    api.get<PaginatedResponse<ForumThread>>(`/v1/forums/${forumId}/threads`, { cursor }),
  getForumThread: (id: number) => api.get<ForumThread & { replies: ForumReply[] }>(`/v1/forums/threads/${id}`),
  createForumThread: (forumId: number, data: { title: string; content: string }) =>
    api.post<ForumThread>(`/v1/forums/${forumId}/threads`, data),
  createForumReply: (threadId: number, data: { content: string; quote_reply_id?: number }) =>
    api.post<ForumReply>(`/v1/forums/threads/${threadId}/replies`, data),
  voteForumThread: (id: number, vote: 1 | -1) =>
    api.post<void>(`/v1/forums/threads/${id}/vote`, { vote }),
  updateForumThread: (id: number, data: { title?: string; content?: string }) =>
    api.put<ForumThread>(`/v1/forums/threads/${id}`, data),
  deleteForumThread: (id: number) => api.delete<void>(`/v1/forums/threads/${id}`),
  getForumReplies: (threadId: number, cursor?: string) =>
    api.get<PaginatedResponse<ForumReply>>(`/v1/forums/threads/${threadId}/replies`, { cursor }),
  updateForumReply: (id: number, data: { content: string }) =>
    api.put<ForumReply>(`/v1/forums/replies/${id}`, data),
  deleteForumReply: (id: number) => api.delete<void>(`/v1/forums/replies/${id}`),
  shareForumThread: (id: number) => api.post<void>(`/v1/forums/threads/${id}/share`),

  // Movies
  getMovies: (cursor?: string, genre?: string) =>
    api.get<PaginatedResponse<Movie>>("/v1/movies", { cursor, genre }),
  getMovie: (id: number) => api.get<Movie>(`/v1/movies/${id}`),
  createMovie: (data: Partial<Movie> & { title: string }) =>
    api.post<Movie>("/v1/movies", data),
  updateMovie: (id: number, data: Partial<Movie>) =>
    api.put<Movie>(`/v1/movies/${id}`, data),
  deleteMovie: (id: number) => api.delete<void>(`/v1/movies/${id}`),
  getMovieComments: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<unknown>>(`/v1/movies/${id}/comments`, { cursor }),
  addMovieComment: (id: number, content: string) =>
    api.post<unknown>(`/v1/movies/${id}/comments`, { content }),
  reactToMovie: (id: number, reaction: string) =>
    api.post<void>(`/v1/movies/${id}/react`, { reaction }),
  watchMovie: (id: number) => api.post<void>(`/v1/movies/${id}/watch`),

  // Games
  getGames: () => api.get<Game[]>("/v1/games"),
  getMyGames: () => api.get<Game[]>("/v1/games/my"),
  getGame: (id: number) => api.get<Game>(`/v1/games/${id}`),
  playGame: (id: number) => api.post<void>(`/v1/games/${id}/play`),
  deleteGame: (id: number) => api.delete<void>(`/v1/games/${id}`),

  // Live
  getLiveStreams: () => api.get<unknown[]>("/v1/live/active"),
  getLiveFriends: () => api.get<unknown[]>("/v1/live/friends"),
  startLiveStream: (data: { title: string }) =>
    api.post<{ room_name: string; token: string }>("/v1/live/start", data),
  stopLiveStream: () => api.post<void>("/v1/live/stop"),
  liveComment: (id: number, content: string) =>
    api.post<void>(`/v1/live/${id}/comment`, { content }),
  liveReact: (id: number, reaction: string) =>
    api.post<void>(`/v1/live/${id}/react`, { reaction }),

  // User Ads
  getUserAds: (cursor?: string) =>
    api.get<PaginatedResponse<UserAd>>("/v1/ads/my", { cursor }),
  createUserAd: (data: Partial<UserAd> & { name: string }) =>
    api.post<UserAd>("/v1/ads", data),
  updateUserAd: (id: number, data: Partial<UserAd>) =>
    api.put<UserAd>(`/v1/ads/${id}`, data),
  cancelUserAd: (id: number) => api.delete<void>(`/v1/ads/${id}`),
  getAdStats: (id: number) =>
    api.get<{ date: string; impressions: number; clicks: number }[]>(`/v1/ads/${id}/stats`),
  getEstimatedAudience: (params: Record<string, unknown>) =>
    api.get<{ estimated_audience: number }>("/v1/ads/estimated-audience", params as Record<string, string>),
  recordAdView: (id: number) => api.post<void>(`/v1/ads/${id}/view`),
  recordAdClick: (id: number) => api.post<void>(`/v1/ads/${id}/click`),

  // Developer / OAuth
  getDeveloperApps: () => api.get<OAuthApp[]>("/v1/oauth/apps"),
  createDeveloperApp: (data: { name: string; description: string; website: string; callback_url: string }) =>
    api.post<OAuthApp>("/v1/oauth/apps", data),
  getDeveloperApp: (id: number) => api.get<OAuthApp>(`/v1/oauth/apps/${id}`),
  updateDeveloperApp: (id: number, data: Partial<{ name: string; description: string; website: string; callback_url: string }>) =>
    api.put<OAuthApp>(`/v1/oauth/apps/${id}`, data),
  deleteDeveloperApp: (id: number) => api.delete<void>(`/v1/oauth/apps/${id}`),
  getAppPermissions: (id: number) => api.get<unknown>(`/v1/oauth/apps/${id}/permissions`),
  getOAuthConsent: (clientId: string, scopes: string[]) =>
    api.get<unknown>("/v1/oauth/authorize", { client_id: clientId, scopes: scopes.join(",") }),
  authorizeOAuth: (clientId: string, scopes: string[]) =>
    api.post<{ redirect_url: string }>("/v1/oauth/authorize", { client_id: clientId, scopes }),

  // Custom Pages (public)
  getCustomPages: () =>
    api.get<{ id: number; slug: string; title: string; content: string; page_type: string }[]>("/v1/pages/custom"),
  getCustomPage: (slug: string) =>
    api.get<{ id: number; slug: string; title: string; content: string; page_type: string }>(`/v1/pages/custom/${slug}`),
};
