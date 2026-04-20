import { api } from "./client";
import type { User, PaginatedResponse } from "./types/index";

/**
 * Configurable site_config key definition, returned by
 * `GET /v1/admin/config/catalog`. Drives the auto-generated settings forms
 * in the admin UI — see `@/components/admin/CatalogSettingsForm`.
 * Shape mirrors `admin-service/src/handlers/config_catalog.rs::FieldSpec`.
 */
export type ConfigFieldType =
  | "text"
  | "password"
  | "email"
  | "url"
  | "number"
  | "boolean"
  | "textarea"
  | "select"
  | "json"
  | "media_url";

export interface ConfigFieldSpec {
  category: string;
  key: string;
  label: string;
  type: ConfigFieldType;
  description?: string;
  group?: string;
  default?: string;
  secret?: boolean;
  options?: string[];
  placeholder?: string;
}

export const adminApi = {
  getDashboardStats: () => api.get<Record<string, number>>("/v1/admin/dashboard"),
  getDashboardCharts: () => api.get<{
    user_growth: { date: string; value: number }[];
    revenue: { date: string; value: number }[];
    top_countries: { country: string; count: number }[];
  }>("/v1/admin/dashboard/charts"),
  getTopCountries: () => api.get<{ country: string; count: number }[]>("/v1/admin/dashboard/top-countries"),
  getSystemInfo: () => api.get<Record<string, unknown>>("/v1/admin/system-info"),
  getChangelog: () =>
    api.get<{
      backend_version: string;
      migrations: Array<{
        version: string;
        description: string;
        installed_on: string;
        success: boolean;
        execution_time_ms: number;
      }>;
    }>("/v1/admin/changelog"),
  getUsers: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<PaginatedResponse<User>>("/v1/admin/users", params),
  getUser: (id: number) => api.get<User>(`/v1/admin/users/${id}`),
  banUser: (id: number) => api.post<void>(`/v1/admin/users/${id}/ban`),
  unbanUser: (id: number) => api.post<void>(`/v1/admin/users/${id}/unban`),
  verifyUser: (id: number) => api.post<void>(`/v1/admin/users/${id}/verify`),
  makeUserPro: (id: number) => api.post<void>(`/v1/admin/users/${id}/make-pro`),
  makeUserAdmin: (id: number) => api.post<void>(`/v1/admin/users/${id}/make-admin`),
  deleteUser: (id: number) => api.delete<void>(`/v1/admin/users/${id}`),
  updateUser: (id: number, data: Partial<import("./types/index").User>) =>
    api.put<void>(`/v1/admin/users/${id}`, data),
  updateUserPermissions: (id: number, perms: Record<string, boolean>) =>
    api.put<void>(`/v1/admin/users/${id}/permissions`, perms),
  getUserPermissions: (id: number) =>
    api.get<Record<string, boolean>>(`/v1/admin/users/${id}/permissions`),
  removeUserAdmin: (id: number) => api.post<void>(`/v1/admin/users/${id}/remove-admin`),
  removeUserPro: (id: number) => api.post<void>(`/v1/admin/users/${id}/remove-pro`),
  topUpWallet: (id: number, amount: number) =>
    api.post<void>(`/v1/admin/users/${id}/top-up`, { amount }),
  deleteUserContent: (id: number) => api.delete<void>(`/v1/admin/users/${id}/content`),
  sendEmailToUser: (data: { user_id: number; subject: string; body: string }) =>
    api.post<void>("/v1/admin/send-email", data),
  getReports: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/reports", params),
  resolveReport: (id: number, action: string) =>
    api.post<void>(`/v1/admin/reports/${id}/resolve`, { action }),
  dismissReport: (id: number) =>
    api.post<void>(`/v1/admin/reports/${id}/dismiss`),
  getPendingPosts: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/moderation/posts", params),
  approvePost: (id: number) => api.post<void>(`/v1/admin/moderation/posts/${id}/approve`),
  rejectPost: (id: number) => api.post<void>(`/v1/admin/moderation/posts/${id}/reject`),
  getPendingBlogs: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/moderation/blogs", params),
  approveBlog: (id: number) => api.post<void>(`/v1/admin/moderation/blogs/${id}/approve`),
  rejectBlog: (id: number) => api.post<void>(`/v1/admin/moderation/blogs/${id}/reject`),
  getVerificationRequests: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/verifications", params),
  approveVerification: (id: number) => api.post<void>(`/v1/admin/verifications/${id}/approve`),
  rejectVerification: (id: number) => api.post<void>(`/v1/admin/verifications/${id}/reject`),
  getBannedIPs: () => api.get<{ ip: string; created_at: string }[]>("/v1/admin/banned-ips"),
  addBannedIP: (ip: string) => api.post<void>("/v1/admin/banned-ips", { ip }),
  removeBannedIP: (ip: string) => api.delete<void>(`/v1/admin/banned-ips/${encodeURIComponent(ip)}`),
  getConfig: () => api.get<Record<string, unknown>>("/v1/admin/config"),
  getConfigCategory: (category: string) =>
    api.get<Record<string, unknown>>(`/v1/admin/config/${category}`),
  updateConfig: (data: Record<string, unknown>) =>
    api.put<void>("/v1/admin/config", data),
  updateConfigCategory: (category: string, data: Record<string, unknown>) =>
    api.put<void>(`/v1/admin/config/${category}`, data),
  getConfigCatalog: () =>
    api.get<{
      categories: string[];
      fields: ConfigFieldSpec[];
      by_category: Record<string, ConfigFieldSpec[]>;
      total: number;
    }>("/v1/admin/config/catalog"),
  getLanguages: () => api.get<unknown[]>("/v1/admin/languages"),
  createLanguage: (data: { name: string; code: string; rtl: boolean }) =>
    api.post<unknown>("/v1/admin/languages", data),
  updateLanguage: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/languages/${id}`, data),
  deleteLanguage: (id: number) => api.delete<void>(`/v1/admin/languages/${id}`),
  getTranslations: (params?: { lang?: string }) =>
    api.get<Record<string, string>>("/v1/admin/translations", params),
  upsertTranslation: (data: { lang: string; key: string; value: string }) =>
    api.post<void>("/v1/admin/translations", data),
  bulkUpsertTranslations: (translations: { lang: string; key: string; value: string }[]) =>
    api.post<void>("/v1/admin/translations/bulk", { translations }),
  deleteTranslation: (id: number) => api.delete<void>(`/v1/admin/translations/${id}`),
  getWithdrawals: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/payments/withdrawals", params),
  approveWithdrawal: (id: number) => api.post<void>(`/v1/admin/payments/withdrawals/${id}/approve`),
  rejectWithdrawal: (id: number) => api.post<void>(`/v1/admin/payments/withdrawals/${id}/reject`),
  getAdminTransactions: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/payments/transactions", params),
  getProPlans: () => api.get<unknown[]>("/v1/admin/payments/pro-plans"),
  upsertProPlan: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/payments/pro-plans", data),
  getBankReceipts: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/bank-receipts", params),
  approveBankReceipt: (id: number) => api.post<void>(`/v1/admin/bank-receipts/${id}/approve`),
  rejectBankReceipt: (id: number) => api.post<void>(`/v1/admin/bank-receipts/${id}/reject`),
  getRefundRequests: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/refunds", params),
  approveRefund: (id: number) => api.post<void>(`/v1/admin/refunds/${id}/approve`),
  rejectRefund: (id: number) => api.post<void>(`/v1/admin/refunds/${id}/reject`),
  triggerBackup: () => api.post<void>("/v1/admin/backups/trigger"),
  getBackups: () => api.get<unknown[]>("/v1/admin/backups"),
  sendNewsletter: (data: { subject: string; content: string; segment?: string }) =>
    api.post<void>("/v1/admin/newsletter/send", data),
  getAnnouncements: () => api.get<unknown[]>("/v1/admin/announcements"),
  createAnnouncement: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/announcements", data),
  updateAnnouncement: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/announcements/${id}`, data),
  deleteAnnouncement: (id: number) => api.delete<void>(`/v1/admin/announcements/${id}`),
  getSystemHealth: () => api.get<Record<string, unknown>>("/v1/admin/health"),
  getPaymentStats: () => api.get<{
    total_revenue: number;
    total_transactions: number;
    pending_withdrawals: number;
    revenue_chart: { date: string; value: number }[];
    currency: string;
  }>("/v1/admin/payments/stats"),
  getCategories: (type?: string) =>
    api.get<{ id: number; name: string; type: string; parent_id?: number; active: boolean; sort_order: number }[]>(
      "/v1/admin/categories", type ? { type } : undefined
    ),
  createCategory: (data: { name: string; type: string; parent_id?: number }) =>
    api.post<{ id: number; name: string; type: string }>("/v1/admin/categories", data),
  updateCategory: (id: number, data: { name?: string; active?: boolean; sort_order?: number }) =>
    api.patch<void>(`/v1/admin/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete<void>(`/v1/admin/categories/${id}`),
  sendMassNotification: (data: { title: string; message: string; segment?: string }) =>
    api.post<void>("/v1/admin/mass-notifications", data),
  getOAuthApps: () => api.get<unknown[]>("/v1/admin/oauth-apps"),
  toggleOAuthApp: (id: number) => api.post<void>(`/v1/admin/oauth-apps/${id}/toggle`),
  deleteOAuthApp: (id: number) => api.delete<void>(`/v1/admin/oauth-apps/${id}`),
  getApiKeys: () => api.get<unknown[]>("/v1/admin/api-keys"),
  createApiKey: (data: { name: string }) => api.post<unknown>("/v1/admin/api-keys", data),
  toggleApiKey: (id: number) => api.post<void>(`/v1/admin/api-keys/${id}/toggle`),
  deleteApiKey: (id: number) => api.delete<void>(`/v1/admin/api-keys/${id}`),
  getUserAds: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/user-ads", params),
  toggleUserAd: (id: number) => api.post<void>(`/v1/admin/user-ads/${id}/toggle`),
  deleteUserAd: (id: number) => api.delete<void>(`/v1/admin/user-ads/${id}`),
  getSiteAds: () => api.get<unknown[]>("/v1/admin/site-ads"),
  createSiteAd: (data: Record<string, unknown>) => api.post<unknown>("/v1/admin/site-ads", data),
  updateSiteAd: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/site-ads/${id}`, data),
  deleteSiteAd: (id: number) => api.delete<void>(`/v1/admin/site-ads/${id}`),

  // Content management
  getAdminPosts: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/manage-posts", params),
  deleteAdminPost: (id: number) => api.delete<void>(`/v1/admin/posts/${id}`),
  getAdminStories: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/stories", params),
  hideAdminStory: (id: number) => api.post<void>(`/v1/admin/stories/${id}/hide`),
  deleteAdminStory: (id: number) => api.delete<void>(`/v1/admin/stories/${id}`),
  getAdminMovies: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/movies", params),
  approveAdminMovie: (id: number) => api.post<void>(`/v1/admin/movies/${id}/approve`),
  featureAdminMovie: (id: number) => api.post<void>(`/v1/admin/movies/${id}/feature`),
  deleteAdminMovie: (id: number) => api.delete<void>(`/v1/admin/movies/${id}`),
  getAdminForums: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/site-forums", params),
  deleteAdminForum: (id: number) => api.delete<void>(`/v1/admin/site-forums/${id}`),
  getAdminGroups: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/site-groups", params),
  deleteAdminGroup: (id: number) => api.delete<void>(`/v1/admin/site-groups/${id}`),
  getAdminPages: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/site-pages", params),
  deleteAdminPage: (id: number) => api.delete<void>(`/v1/admin/site-pages/${id}`),
  getAdminEvents: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/site-events", params),
  deleteAdminEvent: (id: number) => api.delete<void>(`/v1/admin/site-events/${id}`),
  getAdminProducts: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/site-products", params),
  deleteAdminProduct: (id: number) => api.delete<void>(`/v1/admin/site-products/${id}`),
  getAdminJobs: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/site-jobs", params),
  deleteAdminJob: (id: number) => api.delete<void>(`/v1/admin/site-jobs/${id}`),
  getAdminFunding: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/site-funding", params),
  deleteAdminFunding: (id: number) => api.delete<void>(`/v1/admin/site-funding/${id}`),
  getAdminOrders: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/orders", params),
  getAdminOffers: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/offers", params),
  deleteAdminOffer: (id: number) => api.delete<void>(`/v1/admin/offers/${id}`),
  getAdminReviews: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/reviews", params),
  deleteAdminReview: (id: number) => api.delete<void>(`/v1/admin/reviews/${id}`),

  // System
  getActivityLog: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/activities", params),
  getOnlineUsers: () => api.get<unknown[]>("/v1/admin/online-users"),
  getReferrals: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/referrals", params),
  getAutoSettings: () => api.get<Record<string, unknown>>("/v1/admin/auto-settings"),
  updateAutoDeleteSettings: (data: Record<string, unknown>) =>
    api.put<void>("/v1/admin/auto-settings/auto-delete", data),
  getCustomCode: () => api.get<{ header_code: string; footer_code: string }>("/v1/admin/custom-code"),
  updateCustomCode: (data: { header_code: string; footer_code: string }) =>
    api.put<void>("/v1/admin/custom-code", data),
  getInvitations: () => api.get<unknown[]>("/v1/admin/invitations"),
  createInvitation: (data: { email?: string; max_uses?: number }) =>
    api.post<unknown>("/v1/admin/invitations", data),
  deleteInvitation: (id: number) => api.delete<void>(`/v1/admin/invitations/${id}`),
  getInvitationKeys: () => api.get<unknown[]>("/v1/admin/invitations"),
  getFakeUsers: () => api.get<unknown[]>("/v1/admin/fake-users"),
  createFakeUser: (data: Record<string, unknown>) => api.post<unknown>("/v1/admin/fake-users", data),
  getMassNotifications: () => api.get<unknown[]>("/v1/admin/mass-notifications"),
  getNewsletterSubscribers: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/newsletter/subscribers", params),
  removeNewsletterSubscriber: (id: number) =>
    api.delete<void>(`/v1/admin/newsletter/subscribers/${id}`),
  generateSitemap: () => api.post<void>("/v1/admin/sitemap/generate"),
  getThirdPartySites: () => api.get<unknown[]>("/v1/admin/settings/third_party"),
  uploadToStorage: (formData: FormData) => api.upload<void>("/v1/admin/settings/upload_storage", formData),

  // Customization
  getGifts: () => api.get<unknown[]>("/v1/admin/gifts"),
  createGift: (formData: FormData) => api.upload<unknown>("/v1/admin/gifts", formData),
  updateGift: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/gifts/${id}`, data),
  deleteGift: (id: number) => api.delete<void>(`/v1/admin/gifts/${id}`),
  getReactionTypes: () => api.get<unknown[]>("/v1/admin/reaction-types"),
  createReactionType: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/reaction-types", data),
  updateReactionType: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/reaction-types/${id}`, data),
  deleteReactionType: (id: number) => api.delete<void>(`/v1/admin/reaction-types/${id}`),
  getColoredPostTemplates: () => api.get<unknown[]>("/v1/admin/colored-posts"),
  createColoredPostTemplate: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/colored-posts", data),
  updateColoredPostTemplate: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/colored-posts/${id}`, data),
  deleteColoredPostTemplate: (id: number) => api.delete<void>(`/v1/admin/colored-posts/${id}`),
  getStickerPacks: () => api.get<unknown[]>("/v1/admin/sticker-packs"),
  createStickerPack: (formData: FormData) => api.upload<unknown>("/v1/admin/sticker-packs", formData),
  deleteStickerPack: (id: number) => api.delete<void>(`/v1/admin/sticker-packs/${id}`),
  getEmailTemplates: () => api.get<unknown[]>("/v1/admin/email-templates"),
  createEmailTemplate: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/email-templates", data),
  updateEmailTemplate: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/email-templates/${id}`, data),
  deleteEmailTemplate: (id: number) => api.delete<void>(`/v1/admin/email-templates/${id}`),
  getAdminCustomPages: () => api.get<unknown[]>("/v1/admin/pages"),
  createAdminCustomPage: (data: Record<string, unknown>) => api.post<unknown>("/v1/admin/pages", data),
  updateAdminCustomPage: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/pages/${id}`, data),
  deleteAdminCustomPage: (id: number) => api.delete<void>(`/v1/admin/pages/${id}`),
  getTermsPages: () => api.get<unknown[]>("/v1/admin/terms-pages"),
  updateTermsPage: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/terms-pages/${id}`, data),
  getGenders: () => api.get<unknown[]>("/v1/admin/genders"),
  createGender: (data: { name: string }) => api.post<unknown>("/v1/admin/genders", data),
  updateGender: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/genders/${id}`, data),
  deleteGender: (id: number) => api.delete<void>(`/v1/admin/genders/${id}`),
  getCurrencies: () => api.get<unknown[]>("/v1/admin/currencies"),
  createCurrency: (data: Record<string, unknown>) => api.post<unknown>("/v1/admin/currencies", data),
  updateCurrency: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/currencies/${id}`, data),
  toggleCurrency: (id: number) => api.post<void>(`/v1/admin/currencies/${id}/toggle`),
  deleteCurrency: (id: number) => api.delete<void>(`/v1/admin/currencies/${id}`),
  getProfileFields: () => api.get<unknown[]>("/v1/admin/profile-fields"),
  createProfileField: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/profile-fields", data),
  updateProfileField: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/profile-fields/${id}`, data),
  deleteProfileField: (id: number) => api.delete<void>(`/v1/admin/profile-fields/${id}`),
  getAdminGames: () => api.get<unknown[]>("/v1/admin/games"),
  createAdminGame: (data: Record<string, unknown>) => api.post<unknown>("/v1/admin/games", data),
  toggleAdminGame: (id: number) => api.post<void>(`/v1/admin/games/${id}/toggle`),
  deleteAdminGame: (id: number) => api.delete<void>(`/v1/admin/games/${id}`),
  getProMembers: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/pro-members", params),
  getMonetizationSubscriptions: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/monetization", params),
  getAffiliates: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/settings/affiliates", params),
  getSettingsCategory: (category: string) =>
    api.get<Record<string, unknown>>(`/v1/admin/settings/${category}`),
  updateSettingsCategory: (category: string, data: Record<string, unknown>) =>
    api.put<void>(`/v1/admin/settings/${category}`, data),
  getSubCategories: () => api.get<unknown[]>("/v1/admin/sub-categories"),
  createSubCategory: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/sub-categories", data),
  updateSubCategory: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/sub-categories/${id}`, data),
  deleteSubCategory: (id: number) => api.delete<void>(`/v1/admin/sub-categories/${id}`),
  getForumSections: () => api.get<unknown[]>("/v1/admin/forum-sections"),
  createForumSection: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/forum-sections", data),
  updateForumSection: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/forum-sections/${id}`, data),
  deleteForumSection: (id: number) => api.delete<void>(`/v1/admin/forum-sections/${id}`),
  createAdminForum: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/forums", data),
  getForumThreads: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/forum-threads", params),
  deleteForumThread: (id: number) => api.delete<void>(`/v1/admin/forum-threads/${id}`),
  getForumReplies: (params?: Record<string, string | undefined>) =>
    api.get<PaginatedResponse<unknown>>("/v1/admin/forum-replies", params),
  deleteForumReply: (id: number) => api.delete<void>(`/v1/admin/forum-replies/${id}`),
  createAdminMovie: (data: Record<string, unknown>) =>
    api.post<unknown>("/v1/admin/movies", data),
  updateAdminMovie: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/movies/${id}`, data),
  addAutoFriend: (userId: number) =>
    api.post<void>("/v1/admin/auto-settings/friends", { user_id: userId }),
  removeAutoFriend: (id: number) => api.delete<void>(`/v1/admin/auto-settings/friends/${id}`),
  addAutoJoin: (groupId: number) =>
    api.post<void>("/v1/admin/auto-settings/joins", { group_id: groupId }),
  removeAutoJoin: (id: number) => api.delete<void>(`/v1/admin/auto-settings/joins/${id}`),
  addAutoLike: (pageId: number) =>
    api.post<void>("/v1/admin/auto-settings/likes", { page_id: pageId }),
  removeAutoLike: (id: number) => api.delete<void>(`/v1/admin/auto-settings/likes/${id}`),
  updateStickerPack: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/sticker-packs/${id}`, data),
  getStickerPackStickers: (packId: number) => api.get<unknown[]>(`/v1/admin/sticker-packs/${packId}/stickers`),
  addSticker: (packId: number, formData: FormData) =>
    api.upload<unknown>(`/v1/admin/sticker-packs/${packId}/stickers`, formData),
  deleteSticker: (id: number) => api.delete<void>(`/v1/admin/stickers/${id}`),
  approveAdminBlog: (id: number) => api.post<void>(`/v1/admin/site-blogs/${id}/approve`),
  updateAdminForum: (id: number, data: Record<string, unknown>) =>
    api.put<unknown>(`/v1/admin/site-forums/${id}`, data),

  // AI Providers (routed under /v1/ai to reach ai-service)
  listAiProviders: () =>
    api.get<{
      id: number;
      name: string;
      provider_type: "openai" | "anthropic" | "gemini";
      capability: "text" | "image" | "both";
      api_key_masked: string;
      model_text: string | null;
      model_image: string | null;
      enabled: boolean;
      priority: number;
    }[]>("/v1/ai/admin/providers"),
  createAiProvider: (data: {
    name: string;
    provider_type: "openai" | "anthropic" | "gemini";
    capability: "text" | "image" | "both";
    api_key: string;
    model_text?: string;
    model_image?: string;
    enabled?: boolean;
    priority?: number;
  }) => api.post<{ id: number }>("/v1/ai/admin/providers", data),
  updateAiProvider: (id: number, data: {
    api_key?: string;
    model_text?: string;
    model_image?: string;
    enabled?: boolean;
    priority?: number;
  }) => api.patch<{ updated: true }>(`/v1/ai/admin/providers/${id}`, data),
  deleteAiProvider: (id: number) => api.delete<{ deleted: true }>(`/v1/ai/admin/providers/${id}`),
  testAiProvider: (id: number) =>
    api.post<{ ok: boolean; reply?: string; provider?: string; error?: string }>(
      `/v1/ai/admin/providers/${id}/test`,
    ),
};
