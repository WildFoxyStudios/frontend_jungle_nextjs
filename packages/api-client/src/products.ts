import { api } from "./client";
import type { Product, ProductReview, PaginatedResponse } from "./types/index";

export const productsApi = {
  getProducts: (cursor?: string, filters?: { category?: string; q?: string; lat?: number; lng?: number; distance?: number; price_sort?: 'latest' | 'price_low' | 'price_high' }) =>
    api.get<PaginatedResponse<Product>>("/v1/products", { cursor, ...filters }),
  getProduct: (id: number) => api.get<Product>(`/v1/products/${id}`),
  createProduct: (data: FormData, onProgress?: (pct: number) => void) =>
    api.upload<Product>("/v1/products", data, onProgress),
  updateProduct: (id: number, data: Partial<Product>) =>
    api.put<Product>(`/v1/products/${id}`, data),
  deleteProduct: (id: number) => api.delete<void>(`/v1/products/${id}`),
  getProductReviews: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<ProductReview>>(`/v1/products/${id}/reviews`, { cursor }),
  createReview: (id: number, data: { rating: number; comment: string }) =>
    api.post<ProductReview>(`/v1/products/${id}/reviews`, data),
  getNearbyProducts: (lat: number, lng: number, cursor?: string) =>
    api.get<PaginatedResponse<Product>>("/v1/products/nearby", { lat, lng, cursor }),
  getMyProducts: (cursor?: string) =>
    api.get<PaginatedResponse<Product>>("/v1/products/my", { cursor }),
  getCategories: () =>
    api.get<{ id: number; name: string }[]>("/v1/products/categories"),
  searchProducts: (q: string, cursor?: string) =>
    api.get<PaginatedResponse<Product>>("/v1/products/search", { q, cursor }),
};
