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

  // Saved products
  saveProduct: (productId: number) =>
    api.post<void>(`/v1/products/${productId}/save`, { product_id: productId }),
  unsaveProduct: (productId: number) =>
    api.delete<void>(`/v1/products/${productId}/save`),
  getSavedProducts: (cursor?: string) =>
    api.get<PaginatedResponse<Product>>("/v1/users/me/saved-products", { cursor }),

  /**
   * Plan §3.6 MK3 — seller dashboard numbers in a single round-trip. The
   * `sparkline` field is a 30-day (day, orders, revenue) series ready to
   * plug into a `recharts` `<LineChart>`.
   */
  getMyStats: () =>
    api.get<{
      products: { total: number; active: number };
      orders: { total: number; pending: number; delivered: number };
      revenue_total: string;
      avg_rating: string | null;
      sparkline: Array<{ day: string; orders: number; revenue: string }>;
    }>("/v1/products/me/stats"),
};
