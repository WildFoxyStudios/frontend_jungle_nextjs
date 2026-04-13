import { api } from "./client";
import type { Wallet, Transaction, ProPlan, CreatorTier, WithdrawalRequest, PaginatedResponse } from "./types/index";

export const paymentsApi = {
  getWallet: () => api.get<Wallet>("/v1/payments/wallet/balance"),
  addFunds: (amount: number, gateway: string) =>
    api.post<{ redirect_url?: string; transaction_id: string }>("/v1/payments/wallet/add", { amount, gateway }),
  transferFunds: (userId: number, amount: number) =>
    api.post<void>("/v1/payments/wallet/transfer", { user_id: userId, amount }),
  requestWithdrawal: (data: { amount: number; method: string; account_details: string }) =>
    api.post<WithdrawalRequest>("/v1/payments/withdraw", data),
  getTransactions: (cursor?: string, filters?: { type?: string; from?: string; to?: string }) =>
    api.get<PaginatedResponse<Transaction>>("/v1/payments/history", { cursor, ...filters }),
  getProPlans: () => api.get<ProPlan[]>("/v1/payments/pro/plans"),
  subscribePro: (planId: number, gateway: string) =>
    api.post<{ redirect_url?: string }>("/v1/payments/pro/subscribe", { plan_id: planId, gateway }),
  cancelPro: () => api.post<void>("/v1/payments/pro/cancel"),
  requestProRefund: () => api.post<void>("/v1/payments/pro/refund-request"),
  getCreatorTiers: (userId: number) =>
    api.get<CreatorTier[]>(`/v1/payments/creator/${userId}/tiers`),
  subscribeToCreator: (creatorUserId: number) =>
    api.post<{ redirect_url?: string }>(`/v1/payments/creator/subscribe/${creatorUserId}`),
  unsubscribeFromCreator: (creatorUserId: number) =>
    api.delete<void>(`/v1/payments/creator/subscribe/${creatorUserId}`),
  getMySubscriptions: () => api.get<CreatorTier[]>("/v1/payments/creator/subscriptions"),
  getCreatorSubscribers: (cursor?: string) =>
    api.get<PaginatedResponse<unknown>>("/v1/payments/creator/subscribers", { cursor }),
  uploadBankReceipt: (formData: FormData) =>
    api.upload<void>("/v1/payments/bank-receipt", formData),
  createCreatorTier: (data: { name: string; description: string; price: number; currency: string }) =>
    api.post<CreatorTier>("/v1/payments/creator/tiers", data),
  updateCreatorTier: (id: number, data: Partial<{ name: string; description: string; price: number }>) =>
    api.put<CreatorTier>(`/v1/payments/creator/tiers/${id}`, data),
  deleteCreatorTier: (id: number) => api.delete<void>(`/v1/payments/creator/tiers/${id}`),
  getWithdrawals: () => api.get<PaginatedResponse<WithdrawalRequest>>("/v1/payments/withdrawals"),
};
