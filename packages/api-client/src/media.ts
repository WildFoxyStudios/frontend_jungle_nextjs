import { api } from "./client";
import type { Album, AlbumImage, Reel, Movie, Game, PaginatedResponse, MediaItem } from "./types/index";

export const mediaApi = {
  uploadMedia: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<MediaItem>("/v1/media/upload", formData, onProgress),
  deleteMedia: (id: number) => api.delete<void>(`/v1/media/${id}`),
  getAlbums: (username: string, cursor?: string) =>
    api.get<PaginatedResponse<Album>>(`/v1/users/${username}/albums`, { cursor }),
  createAlbum: (data: { name: string; description?: string }) =>
    api.post<Album>("/v1/albums", data),
  getAlbum: (id: number) => api.get<Album & { images: AlbumImage[] }>(`/v1/albums/${id}`),
  addAlbumImages: (id: number, formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<AlbumImage[]>(`/v1/albums/${id}/images`, formData, onProgress),
  deleteAlbumImage: (albumId: number, imageId: number) => api.delete<void>(`/v1/albums/${albumId}/images/${imageId}`),
  getReels: (cursor?: string) =>
    api.get<PaginatedResponse<Reel>>("/v1/reels", { cursor }),
  createReel: (formData: FormData, onProgress?: (pct: number) => void) =>
    api.upload<Reel>("/v1/reels", formData, onProgress),
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
    api.get<PaginatedResponse<unknown>>(`/v1/reels/${id}/comments`, { cursor }),
  addReelComment: (id: number, content: string) =>
    api.post<unknown>(`/v1/reels/${id}/comments`, { content }),
};
