import { api } from "./client";
import { ApiError } from "./errors";
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
    id?: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

/**
 * Normalizes GET /v1/live/:id after the JSON envelope is unwrapped.
 * Catches the same class of bug as legacy funding detail: nested `{ stream: {...} }`
 * while the UI expects a flat {@link LiveStream}.
 */
export function parseLiveStreamPayload(raw: unknown): LiveStream {
  if (raw === null || typeof raw !== "object") {
    throw new ApiError("LIVE_PARSE_ERROR", "Invalid live stream: empty response");
  }
  const top = raw as Record<string, unknown>;

  const candidates: unknown[] = [
    top,
    top["data"],
    top["stream"],
    top["live_stream"],
    top["live"],
  ];

  let row: Record<string, unknown> | null = null;
  for (const c of candidates) {
    if (c && typeof c === "object" && !Array.isArray(c)) {
      const o = c as Record<string, unknown>;
      if (typeof o.stream_key === "string" && o.stream_key.trim()) {
        row = o;
        break;
      }
    }
  }

  if (!row) {
    throw new ApiError("LIVE_PARSE_ERROR", "Invalid live stream: missing stream_key (API shape mismatch?)");
  }

  const id = Number(row["id"]);
  const userId = Number(row["user_id"]);
  if (!Number.isFinite(id) || !Number.isFinite(userId)) {
    throw new ApiError("LIVE_PARSE_ERROR", "Invalid live stream: missing id or user_id");
  }

  const streamKey = String(row["stream_key"]).trim();
  const statusRaw = row["status"];
  const status: "live" | "ended" = statusRaw === "ended" ? "ended" : "live";
  const viewerRaw = Number(row["viewer_count"] ?? 0);
  const createdRaw = row["created_at"];
  const created_at =
    typeof createdRaw === "string" ? createdRaw : createdRaw != null ? String(createdRaw) : "";

  const out: LiveStream = {
    id,
    user_id: userId,
    title: typeof row["title"] === "string" ? row["title"] : "",
    stream_key: streamKey,
    status,
    viewer_count: Number.isFinite(viewerRaw) ? viewerRaw : 0,
    created_at,
  };

  const pub = row["publisher"];
  if (pub && typeof pub === "object") {
    out.publisher = pub as NonNullable<LiveStream["publisher"]>;
  }

  return out;
}

export interface LiveNativeRoom {
  id: string;
  owner_id: number;
  title: string;
  kind: "live" | "audio_call" | "video_call";
  max_participants: number;
  participants_count: number;
  created_at: string;
}

export interface LiveNativeIceConfig {
  ice_servers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
}

function toWsProtocol(protocol: string): "ws:" | "wss:" {
  return protocol === "https:" ? "wss:" : "ws:";
}

function normalizeWsBase(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (value.startsWith("ws://") || value.startsWith("wss://")) {
    return value.replace(/\/+$/, "");
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const url = new URL(value);
    url.protocol = toWsProtocol(url.protocol);
    return url.toString().replace(/\/+$/, "");
  }
  return value.replace(/\/+$/, "");
}

function resolveWsBaseUrl(): string {
  const fromEnv = process.env["NEXT_PUBLIC_WS_URL"]?.trim();
  if (fromEnv) return normalizeWsBase(fromEnv);

  const fromApiEnv = process.env["NEXT_PUBLIC_API_URL"]?.trim();
  if (fromApiEnv) {
    try {
      const base =
        fromApiEnv.startsWith("http://") || fromApiEnv.startsWith("https://")
          ? new URL(fromApiEnv)
          : null;
      if (base) {
        base.protocol = toWsProtocol(base.protocol);
        base.pathname = "/ws";
        base.search = "";
        base.hash = "";
        let out = base.toString().replace(/\/$/, "");
        if (typeof window !== "undefined" && window.location.port === "3000") {
          try {
            const u = new URL(out);
            if (
              (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
              (u.port === "3000" || u.port === "")
            ) {
              u.port = "8080";
              out = u.toString().replace(/\/$/, "");
            }
          } catch { /* ignore */ }
        }
        return out;
      }
    } catch {
      // Fall back to local default.
    }
  }

  if (typeof window !== "undefined") {
    return toWsProtocol(window.location.protocol) + "//" + window.location.host + "/ws";
  }

  return "ws://localhost:8080/ws";
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
  getLiveStream: async (id: number) => {
    const raw = await api.get<unknown>(`/v1/live/${id}`);
    return parseLiveStreamPayload(raw);
  },
  commentOnLive: (id: number, content: string) =>
    api.post<{ commented: boolean }>(`/v1/live/${id}/comment`, { content }),
  reactToLive: (id: number, reaction: string) =>
    api.post<{ reaction: string }>(`/v1/live/${id}/react`, { reaction }),
  /**
   * Fetch the post-live VOD (HLS) playback metadata for a stream that
   * has finished. Resolves to `null` if the stream is still live or
   * the publisher hasn't packaged the recording yet.
   */
  getLiveVod: (id: number) =>
    api
      .get<{
        stream_id: number;
        user_id: number;
        title: string;
        status: "live" | "ended";
        vod_url: string;
        vod_thumbnail?: string | null;
        vod_duration_seconds?: number | null;
        vod_ready_at?: string | null;
        ended_at?: string | null;
      }>(`/v1/live/${id}/vod`)
      .catch(() => null),
};

export const liveNativeApi = {
  createRoom: (data: {
    title: string;
    kind: "live" | "audio_call" | "video_call";
    max_participants?: number;
  }) => api.post<LiveNativeRoom>("/v1/live-native/rooms", data),
  listRooms: () => api.get<LiveNativeRoom[]>("/v1/live-native/rooms").then((r) => (Array.isArray(r) ? r : [])),
  getRoom: (roomId: string) => api.get<LiveNativeRoom>(`/v1/live-native/rooms/${roomId}`),
  joinRoom: (roomId: string) =>
    api.post<{ joined: boolean; room_id: string }>(`/v1/live-native/rooms/${roomId}/join`, {}),
  leaveRoom: (roomId: string) =>
    api.post<{ left: boolean; room_id: string }>(`/v1/live-native/rooms/${roomId}/leave`, {}),
  getIceConfig: () => api.get<LiveNativeIceConfig>("/v1/live-native/ice-config"),
  wsUrl: (token: string, roomId: string) => {
    const base = resolveWsBaseUrl();
    const nativeBase = base.endsWith("/ws") ? `${base}/live-native` : `${base.replace(/\/$/, "")}/ws/live-native`;
    return `${nativeBase}?token=${encodeURIComponent(token)}&room_id=${encodeURIComponent(roomId)}`;
  },
};
