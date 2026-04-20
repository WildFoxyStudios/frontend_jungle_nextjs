import { api } from "./client";
import type { Page, PaginatedResponse, PublicUser } from "./types/index";
// Re-export NearbyPage (defined below) via the barrel so consumers can import it.

export const pagesApi = {
  getPages: (cursor?: string) =>
    api.get<PaginatedResponse<Page>>("/v1/pages", { cursor }),
  getCategories: () => api.get<{ id: number; name: string }[]>("/v1/pages/categories"),
  searchPages: (q: string, cursor?: string) =>
    api.get<PaginatedResponse<Page>>("/v1/pages/search", { q, cursor }),
  getSuggested: (cursor?: string) =>
    api.get<PaginatedResponse<Page>>("/v1/pages/suggested", { cursor }),
  getMyPages: (cursor?: string) =>
    api.get<PaginatedResponse<Page>>("/v1/pages/my", { cursor }),
  getLikedPages: (cursor?: string) =>
    api.get<PaginatedResponse<Page>>("/v1/pages/liked", { cursor }),
  getPage: (slug: string) => api.get<Page>(`/v1/pages/${slug}`),
  createPage: (data: Partial<Page> & { name: string }) =>
    api.post<Page>("/v1/pages", data),
  updatePage: (id: number, data: Partial<Page>) =>
    api.put<Page>(`/v1/pages/${id}`, data),
  deletePage: (id: number) => api.delete<void>(`/v1/pages/${id}`),
  likePage: (id: number) => api.post<void>(`/v1/pages/${id}/like`),
  unlikePage: (id: number) => api.delete<void>(`/v1/pages/${id}/like`),
  ratePage: (id: number, rating: number, comment?: string) =>
    api.post<void>(`/v1/pages/${id}/rate`, { rating, comment }),
  getPageRatings: (id: number) => api.get<unknown[]>(`/v1/pages/${id}/ratings`),
  getPageLikers: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>(`/v1/pages/${id}/likes`, { cursor }),
  getPageAdmins: (id: number) => api.get<PublicUser[]>(`/v1/pages/${id}/admins`),
  addPageAdmin: (id: number, userId: number) =>
    api.post<void>(`/v1/pages/${id}/admins`, { user_id: userId }),
  removePageAdmin: (id: number, userId: number) =>
    api.delete<void>(`/v1/pages/${id}/admins/${userId}`),
  getPagePosts: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<import("./types/index").Post>>(`/v1/pages/${id}/posts`, { cursor }),
  inviteLike: (id: number, userIds: number[]) =>
    api.post<void>(`/v1/pages/${id}/invite`, { user_ids: userIds }),
  uploadPageAvatar: (id: number, formData: FormData) =>
    api.upload<{ avatar: string }>(`/v1/pages/${id}/avatar`, formData),
  uploadPageCover: (id: number, formData: FormData) =>
    api.upload<{ cover: string }>(`/v1/pages/${id}/cover`, formData),
  boostPage: (id: number) => api.post<void>(`/v1/pages/${id}/boost`),
  requestVerification: (id: number) => api.post<void>(`/v1/pages/${id}/verify`),
  getNonLikers: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<PublicUser>>(`/v1/pages/${id}/non-likes`, { cursor }),
  checkName: (name: string) => api.get<{ available: boolean }>("/v1/pages/check-name", { name }),
  getPageOffers: (pageId: number, cursor?: string) =>
    api.get<PaginatedResponse<{ id: number; title: string; description: string; discount: string; image?: string; expires_at?: string; created_at: string }>>(`/v1/pages/${pageId}/offers`, { cursor }),
  createPageOffer: (pageId: number, data: { title: string; description: string; discount: string; image?: string; expires_at?: string }) =>
    api.post<{ id: number }>(`/v1/pages/${pageId}/offers`, data),
  deletePageOffer: (pageId: number, offerId: number) =>
    api.delete<void>(`/v1/pages/${pageId}/offers/${offerId}`),
  getBoostedPages: (cursor?: string) =>
    api.get<PaginatedResponse<Page>>("/v1/boosted/pages", { cursor }),
  getPageServices: (pageId: number) =>
    api.get<{ id: number; title: string; description: string; price: string; image?: string }[]>(`/v1/pages/${pageId}/services`),
  createPageService: (pageId: number, data: { title: string; description: string; price: string; image?: string }) =>
    api.post<{ id: number }>(`/v1/pages/${pageId}/services`, data),
  deletePageService: (pageId: number, serviceId: number) =>
    api.delete<void>(`/v1/pages/${pageId}/services/${serviceId}`),
  getNearbyPages: (params: {
    lat: number;
    lng: number;
    radius_km?: number;
    category?: string;
    limit?: number;
  }) =>
    api.get<NearbyPage[]>(
      "/v1/pages/nearby",
      params as unknown as Record<string, string | number | boolean>
    ),
};

export interface NearbyPage {
  id: number;
  page_name: string;
  page_title: string;
  avatar: string;
  cover: string;
  about: string;
  category_id: number | null;
  address: string;
  is_verified: boolean;
  like_count: number;
  lat: number | null;
  lng: number | null;
  distance_km: number;
}
