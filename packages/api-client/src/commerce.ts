import { api } from "./client";
import type { Order, Cart, Funding, Offer, PaginatedResponse } from "./types/index";

export const commerceApi = {
  getOrders: (cursor?: string) =>
    api.get<PaginatedResponse<Order>>("/v1/orders/my", { cursor }),
  getSales: (cursor?: string) =>
    api.get<PaginatedResponse<Order>>("/v1/orders/sales", { cursor }),
  getOrder: (id: number) => api.get<Order>(`/v1/orders/${id}`),
  createOrder: (productId: number, data: { quantity: number; address_id: number }) =>
    api.post<Order>("/v1/orders", { product_id: productId, ...data }),
  updateOrderStatus: (id: number, status: string) =>
    api.put<Order>(`/v1/orders/${id}/status`, { status }),
  getOrderTracking: (id: number) => api.get<unknown>(`/v1/orders/${id}/tracking`),
  requestOrderRefund: (id: number, reason: string) =>
    api.post<void>(`/v1/orders/${id}/refund`, { reason }),
  /**
   * Download an order's invoice PDF. Returns the Blob and suggested filename;
   * callers typically pipe it into an `<a>` with `URL.createObjectURL(...)`.
   */
  downloadOrderInvoice: (id: number) =>
    api.getBlob(`/v1/orders/${id}/invoice`),
  getCart: () => api.get<Cart>("/v1/cart"),
  addToCart: (productId: number, qty: number) =>
    api.post<Cart>("/v1/cart", { product_id: productId, quantity: qty }),
  updateCartItem: (id: number, qty: number) =>
    api.put<Cart>(`/v1/cart/${id}`, { quantity: qty }),
  removeFromCart: (id: number) => api.delete<Cart>(`/v1/cart/${id}`),
  clearCart: () => api.delete<void>("/v1/cart"),
  getFunding: (cursor?: string) =>
    api.get<PaginatedResponse<Funding>>("/v1/fundings", { cursor }),
  getMyFundings: (cursor?: string) =>
    api.get<PaginatedResponse<Funding>>("/v1/fundings/my", { cursor }),
  getFundingCampaign: (id: number) => api.get<Funding>(`/v1/fundings/${id}`),
  createFunding: (data: Partial<Funding> & { title: string; goal_amount: number }) =>
    api.post<Funding>("/v1/fundings", data),
  updateFunding: (id: number, data: Partial<Funding>) =>
    api.put<Funding>(`/v1/fundings/${id}`, data),
  deleteFunding: (id: number) => api.delete<void>(`/v1/fundings/${id}`),
  donateFunding: (id: number, amount: number, gateway: string) =>
    api.post<{ redirect_url?: string }>(`/v1/fundings/${id}/donate`, { amount, gateway }),
  getDonations: (id: number, cursor?: string) =>
    api.get<PaginatedResponse<unknown>>(`/v1/fundings/${id}/donations`, { cursor }),
  getOffers: (cursor?: string) =>
    api.get<PaginatedResponse<Offer>>("/v1/offers", { cursor }),
  getMyOffers: (cursor?: string) =>
    api.get<PaginatedResponse<Offer>>("/v1/offers/my", { cursor }),
  getOffer: (id: number) => api.get<Offer>(`/v1/offers/${id}`),
  createOffer: (data: Partial<Offer> & { title: string }) =>
    api.post<Offer>("/v1/offers", data),
  updateOffer: (id: number, data: Partial<Offer>) =>
    api.put<Offer>(`/v1/offers/${id}`, data),
  deleteOffer: (id: number) => api.delete<void>(`/v1/offers/${id}`),
  getNearbyOffers: (lat: number, lng: number) =>
    api.get<unknown[]>("/v1/offers/nearby", { lat, lng }),
  getNearbyShops: (lat: number, lng: number) =>
    api.get<unknown[]>("/v1/products/nearby", { lat, lng }),
  getNearbyJobs: (lat: number, lng: number) =>
    api.get<unknown[]>("/v1/jobs/nearby", { lat, lng }),
};
