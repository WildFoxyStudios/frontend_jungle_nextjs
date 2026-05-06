import { api } from "./client";
import type { Order, Cart, Funding, Offer, PaginatedResponse } from "./types/index";

type RawCartItem = {
  id: number;
  product_id: number;
  units?: number;
  quantity?: number;
  product_name?: string;
  product_price?: number | string;
  product_image?: string;
};

function normalizeCart(raw: unknown): Cart {
  const payload = (raw ?? {}) as { data?: RawCartItem[] };
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const items = rows.map((row) => {
    const quantity = Number(row.units ?? row.quantity ?? 1);
    const price = Number(row.product_price ?? 0);
    const imageUrl = typeof row.product_image === "string" && row.product_image.length > 0
      ? [{ id: 0, url: row.product_image, type: "image" as const }]
      : [];

    return {
      id: row.id,
      quantity,
      subtotal: quantity * price,
      product: {
        id: row.product_id,
        title: row.product_name ?? "Product",
        description: "",
        price,
        currency: "USD",
        category: "",
        images: imageUrl,
        location: "",
        seller: {
          id: 0,
          uuid: "unknown",
          username: "unknown",
          first_name: "Unknown",
          last_name: "Seller",
          avatar: "",
          is_verified: false,
          is_online: false,
          is_pro: 0,
        },
        rating: 0,
        review_count: 0,
        is_available: true,
        created_at: new Date().toISOString(),
      },
    };
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, total, currency: "USD" };
}

export const commerceApi = {
  getOrders: (cursor?: string) =>
    api.get<PaginatedResponse<Order>>("/v1/orders/my", { cursor }),
  getSales: (cursor?: string) =>
    api.get<PaginatedResponse<Order>>("/v1/orders/sales", { cursor }),
  getOrder: (id: number) => api.get<Order>(`/v1/orders/${id}`),
  /**
   * Creates one order line (single product). Call once per cart row for multi-item carts.
   * `address` is stored as JSON on the order (`orders.address`); backend expects `address`, not `address_id`.
   */
  /**
   * Wallet checkout for the whole cart in **one** server transaction (debit once, `wallet_paid`).
   * Use instead of multiple `createOrder` calls when paying from balance.
   */
  checkoutWithWallet: (data: {
    lines: Array<{ product_id: number; quantity: number }>;
    address?: Record<string, unknown>;
  }) =>
    api.post<{ ids: number[] }>("/v1/orders/checkout-wallet", {
      lines: data.lines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
      })),
      ...(data.address != null ? { address: data.address } : {}),
    }),
  createOrder: (productId: number, data: { quantity: number; address?: Record<string, unknown> }) =>
    api.post<{ id: number }>("/v1/orders", {
      product_id: productId,
      quantity: data.quantity,
      ...(data.address != null ? { address: data.address } : {}),
    }),
  updateOrderStatus: (id: number, status: string) =>
    api.put<Order>(`/v1/orders/${id}/status`, { status }),
  /**
   * Plan §3.6 MK4 — ordered list of tracking milestones. The backend returns
   * a fixed four-step pipeline (pending → confirmed → shipped → delivered)
   * with a boolean `completed` flag for each, making it trivial for the
   * frontend to render a Gantt-style timeline without any date math.
   */
  getOrderTracking: (id: number) =>
    api.get<{
      order_id: number;
      status: string;
      created_at: string;
      updated_at: string;
      tracking_events: Array<{ status: string; label: string; completed: boolean }>;
    }>(`/v1/orders/${id}/tracking`),
  requestOrderRefund: (id: number, reason: string) =>
    api.post<void>(`/v1/orders/${id}/refund`, { reason }),
  /**
   * Download an order's invoice PDF. Returns the Blob and suggested filename;
   * callers typically pipe it into an `<a>` with `URL.createObjectURL(...)`.
   */
  downloadOrderInvoice: (id: number) =>
    api.getBlob(`/v1/orders/${id}/invoice`),
  getCart: async () => normalizeCart(await api.get<unknown>("/v1/cart")),
  addToCart: async (productId: number, qty: number) => {
    await api.post<unknown>("/v1/cart", { product_id: productId, units: qty });
    return commerceApi.getCart();
  },
  updateCartItem: async (id: number, qty: number) => {
    await api.put<unknown>(`/v1/cart/${id}`, { units: qty });
    return commerceApi.getCart();
  },
  removeFromCart: async (id: number) => {
    await api.delete<unknown>(`/v1/cart/${id}`);
    return commerceApi.getCart();
  },
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
