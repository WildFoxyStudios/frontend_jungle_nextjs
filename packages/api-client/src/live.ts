import { api } from "./client";
import type { PaginatedResponse } from "./types/index";

export interface LiveStream {
  id: number;
  user_id: number;
  title: string;
  stream_key: string;
  status: "live" | "ended";
  viewer_count: number;
  created_at: string;
  publisher?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

export const liveApi = {
  startLive: (title: string) =>
    api.post<LiveStream>("/v1/live/start", { title }),
  stopLive: () =>
    api.post<{ stopped: boolean }>("/v1/live/stop"),
  getActiveLives: (cursor?: string) =>
    api.get<PaginatedResponse<LiveStream>>("/v1/live/active", { cursor }),
  getFriendsLive: (cursor?: string) =>
    api.get<PaginatedResponse<LiveStream>>("/v1/live/friends", { cursor }),
  getLiveStream: (id: number) =>
    api.get<LiveStream>(`/v1/live/${id}`),
  commentOnLive: (id: number, content: string) =>
    api.post<{ commented: boolean }>(`/v1/live/${id}/comment`, { content }),
  reactToLive: (id: number, reaction: string) =>
    api.post<{ reaction: string }>(`/v1/live/${id}/react`, { reaction }),
};
