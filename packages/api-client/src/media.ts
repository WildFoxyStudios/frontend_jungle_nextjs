import { api } from "./client";
import type {
  Album,
  AlbumImage,
  Reel,
  ReelAudioTrackSummary,
  Movie,
  Game,
  PaginatedResponse,
  MediaItem,
  Comment,
} from "./types/index";

export const mediaApi = {
  uploadMedia: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<MediaItem>("/v1/media/upload", formData, onProgress),
  deleteMedia: (id: number) => api.delete<void>(`/v1/media/${id}`),
  rotateMedia: (id: number, degrees: number) =>
    api.post<{ id: number; file_url: string; width: number; height: number; updated_at: string }>(
      `/v1/media/${id}/rotate`,
      { degrees },
    ),
  cropMedia: (id: number, region: { x: number; y: number; width: number; height: number }) =>
    api.post<{ id: number; file_url: string; width: number; height: number; updated_at: string }>(
      `/v1/media/${id}/crop`,
      region,
    ),
  getAlbums: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<Album>>(`/v1/users/${username}/albums`, { cursor }),
  createAlbum: (data: { name: string; description?: string }) =>
    api.post<Album>("/v1/albums", data),
  getAlbum: (id: number) => api.get<Album & { images: AlbumImage[] }>(`/v1/albums/${id}`),
  addAlbumImages: (id: number, formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<AlbumImage[]>(`/v1/albums/${id}/images`, formData, onProgress),
  deleteAlbumImage: (albumId: number, imageId: number) => api.delete<void>(`/v1/albums/${albumId}/images/${imageId}`),
  getReels: (cursor?: string, filter?: "following") =>
    api.get<PaginatedResponse<Reel>>("/v1/reels", { cursor, filter }),
  getReelsExplore: (cursor?: string, limit?: number) =>
    api.get<PaginatedResponse<Reel>>("/v1/reels/explore", { cursor, limit }),
  getReelsTrending: () =>
    api
      .get<{ data: Reel[]; meta: Record<string, unknown> }>("/v1/reels/trending")
      .then((r) => (Array.isArray(r) ? r : (r as { data: Reel[] }).data)),
  getReelsByUser: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<Reel>>(`/v1/reels/user/${encodeURIComponent(username)}`, { cursor }),
  getHashtagReels: (tag: string, cursor?: string) =>
    api.get<PaginatedResponse<Reel>>(`/v1/hashtags/${encodeURIComponent(tag)}/reels`, { cursor }),
  getReelAudioTrending: () => api.get<ReelAudioTrackSummary[]>("/v1/reels/audio/trending"),
  searchReelAudio: (q: string) => api.get<ReelAudioTrackSummary[]>("/v1/reels/audio/search", { q }),
  createReelAudioTrack: (body: {
    title: string;
    artist_label?: string;
    source: "user_upload" | "from_reel" | "catalog";
    uploaded_media_id?: number;
    source_post_id?: number;
  }) => api.post<{ id: number }>("/v1/reels/audio", body),
  postReelInsight: (reelId: number, bucket_sec: number) =>
    api.post<{ recorded: boolean }>(`/v1/reels/${reelId}/insights`, { bucket_sec }),
  clearReelViews: () => api.delete<{ deleted: number }>("/v1/reels/views"),
  shareReel: (id: number) => api.post<void>(`/v1/reels/${id}/share`),
  deleteReelComment: (reelId: number, commentId: number) =>
    api.delete<void>(`/v1/reels/${reelId}/comments/${commentId}`),
  /**
   * Create a reel. The backend expects JSON — the video must be uploaded
   * first with `uploadMedia()` to get a `MediaItem`, then passed here.
   * Mirrors the Sunshine PHP flow where the uploader and the post are two
   * independent steps so the video can be retried without recreating the reel
   * record.
   */
  createReel: (data: {
    content?: string;
    media: unknown;
    privacy?: "everyone" | "followers" | "only_me";
    comments_status?: 0 | 1;
    audio_track_id?: number;
    remix_of_post_id?: number;
    template_key?: string;
    allow_remix?: boolean;
  }) => api.post<{ id: number }>("/v1/reels", data),
  deleteReel: (id: number) => api.delete<void>(`/v1/reels/${id}`),
  reactToReel: (id: number, reaction: string) =>
    api.post<void>(`/v1/reels/${id}/react`, { reaction }),
  getMovies: (cursor?: string, genre?: string) =>
    api.get<PaginatedResponse<Movie>>("/v1/movies", { cursor, genre }),
  getGames: () => api.get<Game[]>("/v1/games"),
  getUserPhotos: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<MediaItem>>(`/v1/users/${username}/photos`, { cursor }),
  getUserVideos: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<MediaItem>>(`/v1/users/${username}/videos`, { cursor }),
  getGroupMedia: (groupId: number, cursor?: string) =>
    api.get<PaginatedResponse<MediaItem>>(`/v1/groups/${groupId}/media`, { cursor }),
  getPageMedia: (pageId: number, cursor?: string) =>
    api.get<PaginatedResponse<MediaItem>>(`/v1/pages/${pageId}/media`, { cursor }),
  getReel: (id: number) => api.get<Reel>(`/v1/reels/${id}`),
  viewReel: (id: number) => api.post<void>(`/v1/reels/${id}/view`),
  getReelComments: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<Comment>>(`/v1/reels/${id}/comments`, { cursor }),
  addReelComment: (id: number, content: string, parent_id?: number) =>
    api.post<unknown>(`/v1/reels/${id}/comments`, { content, parent_id }),
};
